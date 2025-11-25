// server.js - Agricultural Supply Chain API Server with Database Integration
const express = require('express');
const { Gateway, Wallets } = require('fabric-network');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
require('dotenv').config();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const nodemailer = require('nodemailer');

// Initialize Prisma
const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));


// Trust proxy for getting real IP addresses
app.set('trust proxy', true);

// Authentication middleware
const authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                success: false,
                error: 'Access denied. No token provided.' 
            });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if session exists and is valid
        const session = await prisma.userSession.findUnique({
            where: { sessionToken: token },
            include: {
                user: {
                    include: {
                        farmerProfile: true,
                        processorProfile: true,
                        distributorProfile: true,
                        retailerProfile: true,
                        regulatorProfile: true,
                        adminProfile: true
                    }
                }
            }
        });
        
        if (!session || session.expiresAt < new Date()) {
            return res.status(401).json({ 
                success: false,
                error: 'Session expired' 
            });
        }
        
        req.user = session.user;
        next();
        
    } catch (error) {
        res.status(401).json({ 
            success: false,
            error: 'Invalid token' 
        });
    }
};

// Configure multer for image uploads

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, 'public', 'uploads', 'profiles');

      // ✅ Correct: mkdir with recursive true and callback
      fs.mkdir(uploadPath, { recursive: true }, (err) => {
        if (err) return cb(err);
        cb(null, uploadPath);
      });
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname);
    }
  });

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});
const createEmailTransporter = () => {
    // Option A: Gmail (easiest for development)
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD
        }
      });
    }
    
    // Option B: Outlook/Hotmail
    if (process.env.OUTLOOK_USER && process.env.OUTLOOK_PASSWORD) {
      return nodemailer.createTransport({
        service: 'outlook',
        auth: {
          user: process.env.OUTLOOK_USER,
          pass: process.env.OUTLOOK_PASSWORD
        }
      });
    }
    
    // Option C: Generic SMTP
    if (process.env.SMTP_HOST) {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      });
    }
    
    // Option D: Development mode - log to console instead
    console.warn('⚠️  No email configuration found. Emails will be logged to console.');
    return nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true
    });
}


// 4. Create email sending function
const sendPasswordResetEmail = async (email, resetToken) => {
  const transporter = createEmailTransporter();
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';
  const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

  // Beautiful email template
  const emailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: linear-gradient(135deg, #10B981, #059669); padding: 40px 20px; text-align: center; }
            .logo { color: white; font-size: 24px; font-weight: bold; }
            .content { padding: 40px 20px; background: #f9f9f9; }
            .button { 
                display: inline-block; 
                background: #10B981; 
                color: white; 
                padding: 15px 30px; 
                text-decoration: none; 
                border-radius: 8px; 
                font-weight: bold;
                margin: 20px 0;
            }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🌱 Plancana Agricultural System</div>
            </div>
            <div class="content">
                <h2>Password Reset Request</h2>
                <p>Hello,</p>
                <p>You requested a password reset for your Plancana account. Click the button below to reset your password:</p>
                <p style="text-align: center;">
                    <a href="${resetLink}" class="button">Reset My Password</a>
                </p>
                <p>This link will expire in 1 hour for security reasons.</p>
                <p>If you didn't request this reset, please ignore this email.</p>
                <p>Best regards,<br>The Plancana Team</p>
            </div>
            <div class="footer">
                <p>© 2025 Plancana Agricultural Supply Chain System</p>
                <p>This is an automated message, please do not reply.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: process.env.FROM_EMAIL || 'noreply@plancana.com',
    to: email,
    subject: '🔐 Password Reset Request - Plancana',
    html: emailHTML
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return { success: false, error: error.message };
  }
};
// Role-based authorization
const authorize = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false,
                error: 'Authentication required' 
            });
        }
        
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false,
                error: 'Access denied. Insufficient permissions.' 
            });
        }
        
        next();
    };
};



// Blockchain connection helper (UNCHANGED - preserves your date handling)
class BlockchainService {
    constructor() {
        this.walletPath = path.join(process.cwd(), 'wallet');
        this.connectionProfilePath = path.resolve(__dirname, '..', '..', 'fabric-samples', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
    }

    async connectToNetwork() {
        try {
            // Create wallet if it doesn't exist
            const wallet = await Wallets.newFileSystemWallet(this.walletPath);

            // Check if user exists in wallet
            const identity = await wallet.get('appUser');
            if (!identity) {
                console.log('User identity does not exist in wallet. Please enroll user first.');
                return null;
            }

            // Load connection profile
            const connectionProfile = JSON.parse(fs.readFileSync(this.connectionProfilePath, 'utf8'));

            // Create gateway
            const gateway = new Gateway();
            await gateway.connect(connectionProfile, {
                wallet,
                identity: 'appUser',
                discovery: { enabled: true, asLocalhost: true }
            });

            // Get network and contract
            const network = await gateway.getNetwork('mychannel');
            const contract = network.getContract('agricultural-contract');

            return { gateway, contract };
        } catch (error) {
            console.error(`Failed to connect to network: ${error}`);
            return null;
        }
    }

    async generateBatchId() {
        // Generate unique batch ID with timestamp
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `BATCH${timestamp}${random}`;
    }

    async generateQRCode(batchId) {
        const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';
        try {
            const qrData = {
                batchId: batchId,
                verificationUrl: `${FRONTEND_URL}/verify/${batchId}`,
                timestamp: new Date().toISOString(),
                network: 'agricultural-blockchain'
            };

            const qrCodeData = await QRCode.toDataURL(JSON.stringify(qrData), {
                errorCorrectionLevel: 'M',
                type: 'image/png',
                quality: 0.92,
                margin: 1,
                width: 256
            });

            return qrCodeData;
        } catch (error) {
            console.error('QR code generation failed:', error);
            throw error;
        }
    }

    async submitTransactionWithRetry(contract, functionName, args, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                console.log(`Attempt ${i + 1} to submit transaction: ${functionName}`);
                const result = await contract.submitTransaction(functionName, ...args);
                return result;
            } catch (error) {
                console.error(`Transaction attempt ${i + 1} failed:`, error.message);
                if (i === retries - 1) throw error;
                
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }
}

const blockchainService = new BlockchainService();

// PRESERVE YOUR DATE FORMATTING FUNCTIONS (UNCHANGED)
function formatBlockchainDates(data) {
    if (Array.isArray(data)) {
        return data.map(item => formatBlockchainDates(item));
    }
    
    if (typeof data === 'object' && data !== null) {
        const formatted = { ...data };
        
        // Fix common date fields
        const dateFields = ['createdDate', 'lastUpdated', 'timestamp'];
        
        dateFields.forEach(field => {
            if (formatted[field]) {
                // If it's a nanosecond timestamp (has decimal point)
                if (typeof formatted[field] === 'string' && formatted[field].includes('.')) {
                    const seconds = parseFloat(formatted[field]);
                    formatted[field] = new Date(seconds * 1000).toISOString();
                }
            }
        });
        
        // Fix statusHistory dates
        if (formatted.statusHistory && Array.isArray(formatted.statusHistory)) {
            formatted.statusHistory = formatted.statusHistory.map(history => ({
                ...history,
                timestamp: history.timestamp && history.timestamp.includes('.') 
                    ? new Date(parseFloat(history.timestamp) * 1000).toISOString()
                    : history.timestamp
            }));
        }
        
        return formatted;
    }
    
    return data;
}
function calculateStableHash(batch) {
    // Create a stable version by excluding changing fields
    const stableData = {
        batchId: batch.batchId,
        farmerId: batch.farmerId,
        productType: batch.productType,
        variety: batch.variety,
        quantity: batch.quantity,
        unit: batch.unit,
        harvestDate: batch.harvestDate,
        cultivationMethod: batch.cultivationMethod,
        seedsSource: batch.seedsSource,
        irrigationMethod: batch.irrigationMethod,
        fertilizers: batch.fertilizers,
        pesticides: batch.pesticides,
        qualityGrade: batch.qualityGrade,
        moistureContent: batch.moistureContent,
        proteinContent: batch.proteinContent,
        images: batch.images,
        notes: batch.notes,
        status: batch.status
        // Exclude: id, createdAt, updatedAt, blockchainHash, dataHash, qrCodeHash
    };
    
    return crypto
        .createHash('sha256')
        .update(JSON.stringify(stableData))
        .digest('hex');
}



function formatVerificationData(verification) {
    // Fix timestamp formats
    const formatted = { ...verification };
    
    // Format main dates
    if (formatted.createdDate && formatted.createdDate.includes('.')) {
        formatted.createdDate = new Date(parseFloat(formatted.createdDate) * 1000).toISOString();
        formatted.createdDateFormatted = new Date(parseFloat(verification.createdDate) * 1000).toLocaleString();
    }
    
    if (formatted.lastUpdated && formatted.lastUpdated.includes('.')) {
        formatted.lastUpdated = new Date(parseFloat(formatted.lastUpdated) * 1000).toISOString();
        formatted.lastUpdatedFormatted = new Date(parseFloat(verification.lastUpdated) * 1000).toLocaleString();
    }
    
    // Format status history
    if (formatted.statusHistory && Array.isArray(formatted.statusHistory)) {
        formatted.statusHistory = formatted.statusHistory.map(history => ({
            ...history,
            timestamp: history.timestamp && history.timestamp.includes('.') 
                ? new Date(parseFloat(history.timestamp) * 1000).toISOString()
                : history.timestamp,
            timestampFormatted: history.timestamp && history.timestamp.includes('.')
                ? new Date(parseFloat(history.timestamp) * 1000).toLocaleString()
                : new Date(history.timestamp).toLocaleString()
        }));
    }
    
    // Add verification summary
    formatted.verificationSummary = {
        batchExists: true,
        farmer: formatted.farmer,
        crop: formatted.crop,
        quantity: `${formatted.quantity} kg`,
        location: formatted.location,
        currentStatus: formatted.status || 'created',
        ageInDays: formatted.createdDate 
            ? Math.floor((Date.now() - new Date(formatted.createdDate).getTime()) / (1000 * 60 * 60 * 24))
            : 0,
        totalStatusChanges: formatted.statusHistory ? formatted.statusHistory.length : 0
    };
    
    return formatted;
}

// AUTHENTICATION ROUTES
// Register new user
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, username, password, role, profileData } = req.body;
        
        // Validate required fields
        if (!email || !username || !password || !role) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: email, username, password, role'
            });
        }
        
        // Check if user exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { username }
                ]
            }
        });
        
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'User already exists'
            });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || 12));
        
        // Create user with profile
        const user = await prisma.user.create({
            data: {
                email,
                username,
                password: hashedPassword,
                role,
                status: 'ACTIVE', // Auto-activate for demo
                isEmailVerified: true, // Auto-verify for demo
                
                // Create role-specific profile
                ...(role === 'FARMER' && {
                    farmerProfile: {
                        create: {
                            firstName: profileData?.firstName || 'Farmer',
                            lastName: profileData?.lastName || 'User',
                            farmName: profileData?.farmName || 'My Farm',
                            phone: profileData?.phone || '',
                            address: profileData?.address || '',
                            farmSize: profileData?.farmSize || 0,
                            primaryCrops: profileData?.primaryCrops || [],
                            farmingType: profileData?.farmingType || []
                        }
                    }
                }),
                
                ...(role === 'PROCESSOR' && {
                    processorProfile: {
                        create: {
                            companyName: profileData?.companyName || 'Processing Company',
                            contactPerson: profileData?.contactPerson || username,
                            phone: profileData?.phone || '',
                            facilityType: profileData?.facilityType || [],
                            processingCapacity: profileData?.processingCapacity || 0,
                            certifications: profileData?.certifications || []
                        }
                    }
                }),
                
                ...(role === 'ADMIN' && {
                    adminProfile: {
                        create: {
                            firstName: profileData?.firstName || 'Admin',
                            lastName: profileData?.lastName || 'User',
                            phone: profileData?.phone || '',
                            adminLevel: 'ADMIN',
                            permissions: ['user_management', 'system_config']
                        }
                    }
                })
            }
        });
        
        res.status(201).json({
            success: true,
            message: 'Registration successful',
            userId: user.id
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Registration failed',
            details: error.message
        });
    }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const ipAddress = req.ip;
        const userAgent = req.get('User-Agent');
        
        // Find user with profile
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                farmerProfile: true,
                processorProfile: true,
                distributorProfile: true,
                retailerProfile: true,
                regulatorProfile: true,
                adminProfile: true
            }
        });
        
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }
        
        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }
        
        // Check if account is active
        if (user.status !== 'ACTIVE') {
            return res.status(401).json({
                success: false,
                error: 'Account is not active'
            });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user.id, 
                email: user.email, 
                role: user.role 
            },
            process.env.JWT_SECRET || 'your-default-secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );
        
        // Create session
        const session = await prisma.userSession.create({
            data: {
                userId: user.id,
                sessionToken: token,
                ipAddress,
                userAgent,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            }
        });
        
        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        });
        
        // Log activity
        await prisma.activityLog.create({
            data: {
                userId: user.id,
                action: 'LOGIN',
                ipAddress,
                userAgent,
                metadata: { sessionId: session.id }
            }
        });
        
        // Remove sensitive data
        const { password: _, ...userWithoutPassword } = user;
        
        res.json({
            success: true,
            user: userWithoutPassword,
            token,
            sessionId: session.id
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Login failed'
        });
    }
});
// Request password reset
app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email is required'
            });
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (!user) {
            // Don't reveal if user exists or not for security
            return res.json({
                success: true,
                message: 'If an account with that email exists, we have sent a password reset link.'
            });
        }

        // Generate secure reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

        // Update user with reset token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetPasswordToken: resetToken,
                resetPasswordExpires: resetTokenExpiry
            }
        });

        // Send email (NEW PART!)
        const emailResult = await sendPasswordResetEmail(user.email, resetToken);
        
        if (emailResult.success) {
            console.log(`✅ Password reset email sent to ${email}`);
        } else {
            console.error(`❌ Failed to send email to ${email}:`, emailResult.error);
        }

        // Log activity
        await prisma.activityLog.create({
            data: {
                userId: user.id,
                action: 'PASSWORD_RESET_REQUEST',
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                metadata: { 
                    email,
                    emailSent: emailResult.success,
                    messageId: emailResult.messageId
                }
            }
        });

        // Always return success (security - don't reveal if user exists)
        res.json({
            success: true,
            message: 'If an account with that email exists, we have sent a password reset link.'
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// 2. ✅ MUST HAVE - Verify token is valid
app.get('/api/auth/verify-reset-token/:token', async (req, res) => {
    try {
        const { token } = req.params;
        
        console.log('🔍 TOKEN DEBUG: Received token:', token);
        console.log('🔍 TOKEN DEBUG: Token length:', token.length);
        console.log('🔍 TOKEN DEBUG: Current time:', new Date().toISOString());
        
        const user = await prisma.user.findFirst({
            where: {
                resetPasswordToken: token,
                resetPasswordExpires: {
                    gt: new Date()
                }
            }
        });
        
        console.log('🔍 TOKEN DEBUG: User found with token:', !!user);
        if (user) {
            console.log('🔍 TOKEN DEBUG: User email:', user.email);
            console.log('🔍 TOKEN DEBUG: Token expires at:', user.resetPasswordExpires);
            console.log('🔍 TOKEN DEBUG: Current time:', new Date().toISOString());
            console.log('🔍 TOKEN DEBUG: Is expired?', new Date() > user.resetPasswordExpires);
            console.log('🔍 TOKEN DEBUG: Time remaining (minutes):', Math.floor((user.resetPasswordExpires - new Date()) / 1000 / 60));
        }

        // ⭐ THE KEY ISSUE: Make sure response matches what frontend expects
        const response = {
            success: true,
            tokenFound: !!user,  // Frontend expects this field
            user: user ? {
                email: user.email,
                expiresAt: user.resetPasswordExpires
            } : null,
            message: user ? `Reset token is valid` : 'Token not found or expired'
        };

        console.log('✅ TOKEN DEBUG: Sending response:', JSON.stringify(response, null, 2));
        
        res.json(response);
        
    } catch (error) {
        console.error('❌ TOKEN DEBUG: Error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            tokenFound: false 
        });
    }
});

// 3. ✅ MUST HAVE - Update password
app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { token, newPassword, confirmPassword } = req.body;

        // Validation
        if (!token || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                error: 'Token, new password, and confirm password are required'
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                error: 'Passwords do not match'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 6 characters long'
            });
        }

        // Find user with valid reset token
        const user = await prisma.user.findFirst({
            where: {
                resetPasswordToken: token,
                resetPasswordExpires: {
                    gt: new Date()
                }
            }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired reset token'
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS || 12));

        // Update user password and clear reset token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordExpires: null
            }
        });

        // Invalidate all existing sessions for security
        await prisma.userSession.deleteMany({
            where: { userId: user.id }
        });

        console.log(`✅ Password successfully reset for user: ${user.email}`);

        res.json({
            success: true,
            message: 'Password has been reset successfully. Please log in with your new password.'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
app.post('/api/test-email-simple', async (req, res) => {
    const nodemailer = require('nodemailer');
    
    try {
        console.log('🧪 Testing email with config:');
        console.log('Gmail User:', process.env.GMAIL_USER);
        console.log('Gmail Pass (length):', process.env.GMAIL_APP_PASSWORD?.length);
        
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            }
        });

        // Test the connection
        await transporter.verify();
        console.log('✅ SMTP connection verified');

        // Send test email
        const info = await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: req.body.email || process.env.GMAIL_USER, // Send to yourself for testing
            subject: '🧪 Test Email from Plancana',
            text: 'This is a test email. If you receive this, email is working!',
            html: '<h2>✅ Email Working!</h2><p>This is a test email from your Plancana app.</p>'
        });

        console.log('✅ Test email sent:', info.messageId);
        res.json({ 
            success: true, 
            message: 'Test email sent successfully',
            messageId: info.messageId
        });

    } catch (error) {
        console.error('❌ Email test failed:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});
app.get('/api/debug/reset-tokens', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            where: {
                resetPasswordToken: { not: null }
            },
            select: {
                id: true,
                email: true,
                resetPasswordToken: true,
                resetPasswordExpires: true
            }
        });
        
        res.json({
            success: true,
            count: users.length,
            tokens: users.map(user => ({
                email: user.email,
                tokenExists: !!user.resetPasswordToken,
                tokenLength: user.resetPasswordToken?.length,
                expiresAt: user.resetPasswordExpires,
                isExpired: user.resetPasswordExpires ? new Date() > user.resetPasswordExpires : null,
                timeUntilExpiry: user.resetPasswordExpires ? 
                    Math.round((user.resetPasswordExpires - new Date()) / 1000 / 60) + ' minutes' : null
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



// Get current user profile
app.get('/api/auth/profile', authenticate, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                farmerProfile: {
                    include: {
                        farmLocations: true,
                        batches: {
                            take: 5,
                            orderBy: { createdAt: 'desc' }
                        }
                    }
                },
                processorProfile: true,
                distributorProfile: true,
                retailerProfile: true,
                regulatorProfile: true,
                adminProfile: true
            }
        });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        // Remove sensitive data
        const { password, ...userProfile } = user;
        
        console.log('Profile data being sent:', JSON.stringify(userProfile, null, 2)); // Debug log
        
        res.json({
            success: true,
            user: userProfile
        });
        
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch profile'
        });
    }
});

// MAIN ROUTES (ENHANCED WITH DATABASE INTEGRATION)

// Health check (ENHANCED)
app.get('/', async (req, res) => {
    try {
        // Test database connection
        await prisma.$queryRaw`SELECT 1`;
        const dbStatus = 'connected';
        
        // Test blockchain connection
        const { gateway, contract } = await blockchainService.connectToNetwork();
        const blockchainStatus = contract ? 'connected' : 'disconnected';
        if (gateway) await gateway.disconnect();
        
        res.json({
            message: 'Agricultural Supply Chain API with Database Integration',
            status: 'running',
            timestamp: new Date().toISOString(),
            services: {
                database: dbStatus,
                blockchain: blockchainStatus
            },
            endpoints: {
                'POST /api/auth/register': 'Register new user',
                'POST /api/auth/login': 'Login user',
                'GET /api/auth/profile': 'Get user profile',
                'POST /api/batch/create': 'Create new crop batch',
                'GET /api/batch/:batchId': 'Get batch details',
                'GET /api/verify/:batchId': 'Verify batch (QR scan)',
                'GET /api/batches': 'Get all batches',
                'GET /api/qr/:batchId': 'Get QR code for batch',
                'GET /api/farmer/my-batches': 'Get current farmer batches',
                'GET /api/batch/check/:batchId': 'Check if batch ID exists'
            }
        });
    } catch (error) {
        res.status(500).json({
            message: 'Agricultural Supply Chain API',
            status: 'error',
            error: error.message
        });
    }
});

// Create new crop batch (ENHANCED WITH DATABASE)
app.post('/api/batch/create', authenticate, authorize(['FARMER']), async (req, res) => {
    try {
        const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';
        const { farmer, crop, quantity, location, customBatchId, ...additionalData } = req.body;

        // DEBUG: Log received data
        console.log('📥 Received batch creation request:');
        console.log('   Basic fields:', { farmer, crop, quantity, location });
        console.log('   Additional data:', JSON.stringify(additionalData, null, 2));
        console.log('   Pricing fields:', {
            pricePerUnit: additionalData.pricePerUnit,
            currency: additionalData.currency,
            totalBatchValue: additionalData.totalBatchValue,
            paymentMethod: additionalData.paymentMethod,
            buyerName: additionalData.buyerName
        });

        // Validate required fields
        if (!farmer || !crop || !quantity || !location) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: farmer, crop, quantity, location'
            });
        }

        // Get farmer profile
        const farmerProfile = await prisma.farmerProfile.findUnique({
            where: { userId: req.user.id },
            include: { farmLocations: true }
        });

        if (!farmerProfile) {
            return res.status(400).json({
                success: false,
                error: 'Farmer profile not found'
            });
        }

        // Generate batch ID
        const batchId = customBatchId || await blockchainService.generateBatchId();

        // Connect to blockchain
        const { gateway, contract } = await blockchainService.connectToNetwork();
        if (!contract) {
            return res.status(500).json({
                success: false,
                error: 'Failed to connect to blockchain network'
            });
        }

        try {
            // STEP 1: Create detailed record in database
            const batch = await prisma.batch.create({
                data: {
                    batchId: batchId,
                    farmerId: farmerProfile.id,
                    farmLocationId: farmerProfile.farmLocations[0]?.id, // Use first farm location
                    productType: crop,
                    variety: additionalData.variety || null,
                    quantity: parseFloat(quantity),
                    unit: additionalData.unit || 'kg',
                    harvestDate: additionalData.harvestDate ? new Date(additionalData.harvestDate) : new Date(),
                    cultivationMethod: additionalData.cultivationMethod || null,
                    seedsSource: additionalData.seedsSource || null,
                    irrigationMethod: additionalData.irrigationMethod || null,
                    fertilizers: additionalData.fertilizers || [],
                    pesticides: additionalData.pesticides || [],
                    qualityGrade: additionalData.qualityGrade || null,
                    moistureContent: additionalData.moistureContent ? parseFloat(additionalData.moistureContent) : null,
                    proteinContent: additionalData.proteinContent ? parseFloat(additionalData.proteinContent) : null,
                    images: additionalData.images || [],
                    notes: additionalData.notes || null,
                    // Pricing Information
                    pricePerUnit: additionalData.pricePerUnit ? parseFloat(additionalData.pricePerUnit) : null,
                    currency: additionalData.currency || 'MYR',
                    totalBatchValue: additionalData.totalBatchValue ? parseFloat(additionalData.totalBatchValue) : null,
                    paymentMethod: additionalData.paymentMethod || null,
                    buyerName: additionalData.buyerName || null,
                    // Certifications & Compliance
                    certifications: additionalData.certifications || [],
                    customCertification: additionalData.customCertification || null,
                    status: 'REGISTERED'
                },
                include: {
                    farmer: {
                        include: {
                            user: {
                                select: { username: true, email: true }
                            }
                        }
                    },
                    farmLocation: true
                }
            });

            // STEP 2: Create hash of database data for integrity
            const dataHash = calculateStableHash(batch);

            // STEP 3: Submit critical data to blockchain with pricing and certifications
            const blockchainData = {
                variety: additionalData.variety,
                unit: additionalData.unit || 'kg',
                harvestDate: additionalData.harvestDate,
                cultivationMethod: additionalData.cultivationMethod,
                qualityGrade: additionalData.qualityGrade,
                certifications: additionalData.certifications || [],
                customCertification: additionalData.customCertification,
                // Pricing Information
                pricePerUnit: additionalData.pricePerUnit,
                currency: additionalData.currency || 'MYR',
                totalBatchValue: additionalData.totalBatchValue,
                paymentMethod: additionalData.paymentMethod,
                buyerName: additionalData.buyerName,
                // Coordinates if available
                coordinates: (additionalData.latitude && additionalData.longitude) ? {
                    latitude: parseFloat(additionalData.latitude),
                    longitude: parseFloat(additionalData.longitude)
                } : null
            };

            const result = await blockchainService.submitTransactionWithRetry(
                contract,
                'createBatch',
                [batchId, farmer, crop, quantity.toString(), location, JSON.stringify(blockchainData)]
            );

            // STEP 4: Update database with blockchain reference
            const updatedBatch = await prisma.batch.update({
                where: { id: batch.id },
                data: {
                    blockchainHash: result.toString(),
                    dataHash: dataHash,
                    qrCodeHash: crypto.createHash('sha256').update(`${batchId}_${Date.now()}`).digest('hex')
                }
            });

            // STEP 5: Generate QR code
            const qrCode = await blockchainService.generateQRCode(batchId);

            await gateway.disconnect();

            // STEP 6: Log activity
            await prisma.activityLog.create({
                data: {
                    userId: req.user.id,
                    action: 'CREATE_BATCH',
                    resource: batchId,
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent'),
                    metadata: { batchId: batchId }
                }
            });

            const response = {
                success: true,
                batchId: batchId,
                batchData: JSON.parse(result.toString()),
                databaseRecord: updatedBatch,
                qrCode: qrCode,
                verificationUrl: `${FRONTEND_URL}/verify/${batchId}`,
                message: 'Crop batch created successfully on blockchain and database',
                dataIntegrity: {
                    blockchainHash: result.toString(),
                    databaseHash: dataHash
                }
            };

            console.log(`Successfully created batch: ${batchId}`);
            res.status(201).json(response);

        } catch (blockchainError) {
            await gateway.disconnect();
            console.error('Blockchain transaction failed:', blockchainError);
            
            res.status(500).json({
                success: false,
                error: 'Failed to create batch on blockchain',
                details: blockchainError.message
            });
        }

    } catch (error) {
        console.error('API error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message
        });
    }
});

// Get farmer's batches (ENHANCED)
app.get('/api/farmer/my-batches', authenticate, authorize(['FARMER']), async (req, res) => {
    try {
        const farmerProfile = await prisma.farmerProfile.findUnique({
            where: { userId: req.user.id }
        });

        if (!farmerProfile) {
            return res.status(400).json({
                success: false,
                error: 'Farmer profile not found'
            });
        }

        // Get batches from database
        const batches = await prisma.batch.findMany({
            where: { farmerId: farmerProfile.id },
            include: {
                farmLocation: true,
                processingRecords: {
                    include: {
                        processor: {
                            include: {
                                user: { select: { username: true } }
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        processingRecords: true,
                        transportRoutes: true,
                        qualityTests: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Also get blockchain data for comparison
        const { gateway, contract } = await blockchainService.connectToNetwork();
        let blockchainBatches = [];
        
        if (contract) {
            try {
                const result = await contract.evaluateTransaction('getAllBatches');
                const allBlockchainBatches = JSON.parse(result.toString());
                blockchainBatches = allBlockchainBatches.filter(batch => 
                    batch.farmer.toLowerCase() === req.user.username.toLowerCase()
                );
                await gateway.disconnect();
            } catch (blockchainError) {
                await gateway.disconnect();
                console.error('Blockchain query failed:', blockchainError);
            }
        }

        res.json({
            success: true,
            farmer: req.user.username,
            farmerProfile: {
                farmName: farmerProfile.farmName,
                totalBatches: batches.length
            },
            count: batches.length,
            batches: batches,
            blockchainBatches: formatBlockchainDates(blockchainBatches),
            dataIntegrity: {
                databaseCount: batches.length,
                blockchainCount: blockchainBatches.length,
                syncStatus: batches.length === blockchainBatches.length ? 'SYNCED' : 'OUT_OF_SYNC'
            }
        });

    } catch (error) {
        console.error('API error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Get specific batch details (ENHANCED)
app.get('/api/batch/:batchId', authenticate, async (req, res) => {
    try {
        const { batchId } = req.params;

        // Get from database
        const dbBatch = await prisma.batch.findUnique({
            where: { batchId: batchId },
            include: {
                farmer: {
                    include: {
                        user: {
                            select: { username: true, email: true, role: true }
                        }
                    }
                },
                farmLocation: true,
                processingRecords: {
                    include: {
                        processor: {
                            include: {
                                user: { select: { username: true } }
                            }
                        },
                        facility: true
                    }
                },
                transportRoutes: {
                    include: {
                        distributor: {
                            include: {
                                user: { select: { username: true } }
                            }
                        }
                    }
                },
                qualityTests: true,
                transactions: true
            }
        });

        // Get from blockchain
        const { gateway, contract } = await blockchainService.connectToNetwork();
        let blockchainBatch = null;
        
        if (contract) {
            try {
                const result = await contract.evaluateTransaction('getBatch', batchId);
                blockchainBatch = JSON.parse(result.toString());
                await gateway.disconnect();
            } catch (blockchainError) {
                await gateway.disconnect();
                if (!blockchainError.message.includes('does not exist')) {
                    console.error('Blockchain query failed:', blockchainError);
                }
            }
        }

        if (!dbBatch && !blockchainBatch) {
            return res.status(404).json({
                success: false,
                error: `Batch ${batchId} not found`
            });
        }

        // Role-based data filtering (same as before but with database data)
        let responseData = dbBatch;
        
        switch (req.user.role) {
            case 'FARMER':
                if (dbBatch && dbBatch.farmer.userId !== req.user.id) {
                    return res.status(403).json({
                        success: false,
                        error: 'Access denied'
                    });
                }
                break;
                
            case 'PROCESSOR':
                if (dbBatch) {
                    const hasProcessed = dbBatch.processingRecords.some(
                        record => record.processor.userId === req.user.id
                    );
                    if (!hasProcessed && dbBatch.farmer.userId !== req.user.id) {
                        // Filter sensitive information
                        responseData = {
                            ...dbBatch,
                            farmer: {
                                user: { username: 'FARMER_***' }
                            }
                        };
                    }
                }
                break;
                
            case 'RETAILER':
                // Retailers see limited information
                if (dbBatch) {
                    responseData = {
                        batchId: dbBatch.batchId,
                        productType: dbBatch.productType,
                        variety: dbBatch.variety,
                        quantity: dbBatch.quantity,
                        harvestDate: dbBatch.harvestDate,
                        qualityGrade: dbBatch.qualityGrade,
                        qualityTests: dbBatch.qualityTests,
                        status: dbBatch.status,
                        farmLocation: {
                            farmName: dbBatch.farmLocation?.farmName || 'Farm'
                        }
                    };
                }
                break;
                
            case 'REGULATOR':
            case 'ADMIN':
                // Full access
                break;
                
            default:
                return res.status(403).json({
                    success: false,
                    error: 'Access denied'
                });
        }

        // Data integrity check
        let integrityStatus = 'UNKNOWN';
        if (dbBatch && blockchainBatch && dbBatch.dataHash) {
            const currentHash = crypto
                .createHash('sha256')
                .update(JSON.stringify(dbBatch))
                .digest('hex');
            integrityStatus = currentHash === dbBatch.dataHash ? 'VALID' : 'MODIFIED';
        }

        // Log activity
        await prisma.activityLog.create({
            data: {
                userId: req.user.id,
                action: 'VIEW_BATCH',
                resource: batchId,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            }
        });

        res.json({
            success: true,
            batchId: batchId,
            batchData: responseData,
            blockchain: blockchainBatch ? formatBlockchainDates(blockchainBatch) : null,
            accessLevel: req.user.role,
            dataIntegrity: {
                status: integrityStatus,
                databaseExists: !!dbBatch,
                blockchainExists: !!blockchainBatch,
               lastVerified: new Date().toISOString()
           }
       });

   } catch (error) {
       console.error('API error:', error);
       res.status(500).json({
           success: false,
           error: 'Internal server error',
           details: error.message
       });
   }
});

// Check if batch ID already exists (ENHANCED)
app.get('/api/batch/check/:batchId', async (req, res) => {
   try {
       const { batchId } = req.params;

       // Check in database first (faster)
       const dbBatch = await prisma.batch.findUnique({
           where: { batchId: batchId },
           select: { batchId: true, status: true, createdAt: true }
       });

       // Check in blockchain
       const { gateway, contract } = await blockchainService.connectToNetwork();
       let blockchainExists = false;
       
       if (contract) {
           try {
               await contract.evaluateTransaction('getBatch', batchId);
               blockchainExists = true;
               await gateway.disconnect();
           } catch (blockchainError) {
               await gateway.disconnect();
               blockchainExists = !blockchainError.message.includes('does not exist');
           }
       }

       const exists = !!dbBatch || blockchainExists;

       res.json({
           success: true,
           exists: exists,
           batchId: batchId,
           sources: {
               database: !!dbBatch,
               blockchain: blockchainExists
           },
           message: exists 
               ? `Batch ${batchId} already exists` 
               : `Batch ID ${batchId} is available`,
           batchInfo: dbBatch || null
       });

   } catch (error) {
       console.error('API error:', error);
       res.status(500).json({
           success: false,
           error: 'Internal server error'
       });
   }
});

// Verify batch (QR code endpoint) (ENHANCED)
app.get('/api/verify/:batchId', async (req, res) => {
   try {
       const { batchId } = req.params;

       // Get from database
       const dbBatch = await prisma.batch.findUnique({
           where: { batchId: batchId },
           include: {
               farmer: {
                   include: {
                       user: { select: { username: true } }
                   }
               },
               farmLocation: true,
               processingRecords: {
                   include: {
                       processor: {
                           include: {
                               user: { select: { username: true } }
                           }
                       }
                   }
               },
               qualityTests: {
                   orderBy: { testDate: 'desc' },
                   take: 3
               }
           }
       });

       // Get from blockchain
       const { gateway, contract } = await blockchainService.connectToNetwork();
       let blockchainVerification = null;
       
       if (contract) {
           try {
               const result = await contract.evaluateTransaction('verifyBatch', batchId);
               blockchainVerification = JSON.parse(result.toString());
               await gateway.disconnect();
           } catch (blockchainError) {
               await gateway.disconnect();
               if (!blockchainError.message.includes('does not exist')) {
                   console.error('Blockchain verification failed:', blockchainError);
               }
           }
       }

       if (!dbBatch && !blockchainVerification) {
           return res.status(404).json({
               success: false,
               verified: false,
               error: `Batch ${batchId} not found - potential fraud`,
               verificationTime: new Date().toISOString()
           });
       }

       // Data integrity verification
       let integrityCheck = {
           valid: false,
           message: 'Unable to verify integrity'
       };

       if (dbBatch && blockchainVerification && dbBatch.dataHash) {
           const currentHash = crypto
               .createHash('sha256')
               .update(JSON.stringify(dbBatch))
               .digest('hex');
           
           integrityCheck = {
               valid: currentHash === dbBatch.dataHash,
               message: currentHash === dbBatch.dataHash 
                   ? 'Data integrity verified' 
                   : 'Data may have been modified',
               databaseHash: dbBatch.dataHash,
               currentHash: currentHash
           };
       }

       // Create comprehensive verification response
       const verificationResponse = {
           success: true,
           verified: true,
           batchId: batchId,
           verificationTime: new Date().toISOString(),
           
           // Basic batch info (public)
           batchInfo: {
               productType: dbBatch?.productType || blockchainVerification?.crop,
               quantity: dbBatch?.quantity || blockchainVerification?.quantity,
               harvestDate: dbBatch?.harvestDate || blockchainVerification?.createdDate,
               status: dbBatch?.status || blockchainVerification?.status,
               farmer: dbBatch?.farmer?.user?.username || blockchainVerification?.farmer,
               location: dbBatch?.farmLocation?.farmName || blockchainVerification?.location
           },
           
           // Verification details
           verification: {
               blockchain: blockchainVerification ? formatVerificationData(blockchainVerification) : null,
               database: {
                   exists: !!dbBatch,
                   recordCount: dbBatch ? {
                       processingRecords: dbBatch.processingRecords?.length || 0,
                       qualityTests: dbBatch.qualityTests?.length || 0
                   } : null
               },
               dataIntegrity: integrityCheck
           },
           
           // Supply chain summary
           supplyChainSummary: dbBatch ? {
               totalStages: [
                   'HARVEST',
                   ...(dbBatch.processingRecords?.length > 0 ? ['PROCESSING'] : []),
                   ...(dbBatch.status === 'DELIVERED' ? ['DELIVERY'] : [])
               ],
               currentStage: dbBatch.status,
               qualityAssurance: {
                   testsPerformed: dbBatch.qualityTests?.length || 0,
                   latestTest: dbBatch.qualityTests?.[0] ? {
                       testType: dbBatch.qualityTests[0].testType,
                       result: dbBatch.qualityTests[0].passFailStatus,
                       date: dbBatch.qualityTests[0].testDate
                   } : null
               }
           } : null,
           
           message: 'Batch verified successfully'
       };

       res.json(verificationResponse);

   } catch (error) {
       console.error('API error:', error);
       res.status(500).json({
           success: false,
           verified: false,
           error: 'Internal server error',
           verificationTime: new Date().toISOString()
       });
   }
});

// Update user profile
app.put('/api/auth/profile', authenticate, async (req, res) => {
    try {
        const { profileData, personalData } = req.body;
        const userId = req.user.id;

        // Update basic user info if provided
        const userUpdateData = {};
        if (personalData?.email && personalData.email !== req.user.email) {
            // Check if email already exists
            const existingUser = await prisma.user.findFirst({
                where: { 
                    email: personalData.email,
                    NOT: { id: userId }
                }
            });
            
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    error: 'Email already in use'
                });
            }
            userUpdateData.email = personalData.email;
        }
        
        if (personalData?.username && personalData.username !== req.user.username) {
            // Check if username already exists
            const existingUser = await prisma.user.findFirst({
                where: { 
                    username: personalData.username,
                    NOT: { id: userId }
                }
            });
            
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    error: 'Username already in use'
                });
            }
            userUpdateData.username = personalData.username;
        }

        // Update user if there are changes
        if (Object.keys(userUpdateData).length > 0) {
            await prisma.user.update({
                where: { id: userId },
                data: userUpdateData
            });
        }

        // Update role-specific profile
        let updatedProfile = null;
        
        switch (req.user.role) {
            case 'FARMER':
                updatedProfile = await prisma.farmerProfile.update({
                    where: { userId: userId },
                    data: {
                        firstName: profileData.firstName,
                        lastName: profileData.lastName,
                        phone: profileData.phone,
                        farmName: profileData.farmName,
                        farmSize: profileData.farmSize ? parseFloat(profileData.farmSize) : null,
                        address: profileData.address,
                        state: profileData.state,
                        primaryCrops: profileData.primaryCrops || [],
                        farmingType: profileData.farmingType || [],
                        certifications: profileData.certifications || [],
                        licenseNumber: profileData.licenseNumber,
                        profileImage: profileData.profileImage
                    }
                });
                break;

            case 'PROCESSOR':
                updatedProfile = await prisma.processorProfile.update({
                    where: { userId: userId },
                    data: {
                        companyName: profileData.companyName,
                        contactPerson: profileData.contactPerson,
                        phone: profileData.phone,
                        email: profileData.email,
                        address: profileData.address,
                        state: profileData.state,
                        facilityType: profileData.facilityType || [],
                        processingCapacity: profileData.processingCapacity ? parseFloat(profileData.processingCapacity) : null,
                        certifications: profileData.certifications || [],
                        licenseNumber: profileData.licenseNumber
                    }
                });
                break;

            case 'ADMIN':
                updatedProfile = await prisma.adminProfile.update({
                    where: { userId: userId },
                    data: {
                        firstName: profileData.firstName,
                        lastName: profileData.lastName,
                        phone: profileData.phone,
                        email: profileData.email,
                        permissions: profileData.permissions || []
                    }
                });
                break;

            default:
                return res.status(400).json({
                    success: false,
                    error: 'Profile update not supported for this role'
                });
        }

        // Log activity
        await prisma.activityLog.create({
            data: {
                userId: userId,
                action: 'UPDATE_PROFILE',
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                metadata: { updatedFields: Object.keys(profileData) }
            }
        });

        res.json({
            success: true,
            message: 'Profile updated successfully',
            profile: updatedProfile
        });

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update profile',
            details: error.message
        });
    }
});

// Upload profile picture
app.post('/api/auth/profile/avatar', authenticate, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No image file provided'
            });
        }

        const imageUrl = `/uploads/profiles/${req.file.filename}`;
        
        // Update profile image in database based on user role
        let updatedProfile = null;
        
        switch (req.user.role) {
            case 'FARMER':
                updatedProfile = await prisma.farmerProfile.update({
                    where: { userId: req.user.id },
                    data: { profileImage: imageUrl }
                });
                break;
                
            case 'PROCESSOR':
                // For processor, we might store it in a different field or table
                // For now, let's add a profileImage field to processor profile too
                break;
                
            case 'ADMIN':
                // Similar handling for admin
                break;
        }

        // Log activity
        await prisma.activityLog.create({
            data: {
                userId: req.user.id,
                action: 'UPDATE_PROFILE_PICTURE',
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                metadata: { imageUrl: imageUrl }
            }
        });

        res.json({
            success: true,
            message: 'Profile picture uploaded successfully',
            imageUrl: imageUrl,
            profile: updatedProfile
        });

    } catch (error) {
        console.error('Profile picture upload error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to upload profile picture',
            details: error.message
        });
    }
});
// Update batch status (ENHANCED)
app.put('/api/batch/:batchId/status', authenticate, authorize(['FARMER', 'PROCESSOR', 'DISTRIBUTOR', 'ADMIN']), async (req, res) => {
   try {
       const { batchId } = req.params;
       const { status, updatedBy, notes } = req.body;

       // Get batch from database
       const batch = await prisma.batch.findUnique({
           where: { batchId: batchId },
           include: {
               farmer: true,
               processingRecords: {
                   include: { processor: true }
               },
               transportRoutes: {
                   include: { distributor: true }
               }
           }
       });

       if (!batch) {
           return res.status(404).json({
               success: false,
               error: `Batch ${batchId} not found`
           });
       }

       // Check authorization based on role and batch ownership
       let canUpdate = false;
       
       switch (req.user.role) {
           case 'FARMER':
               canUpdate = batch.farmer.userId === req.user.id;
               break;
           case 'PROCESSOR':
               canUpdate = batch.processingRecords.some(
                   record => record.processor.userId === req.user.id
               );
               break;
           case 'DISTRIBUTOR':
               canUpdate = batch.transportRoutes.some(
                   route => route.distributor.userId === req.user.id
               );
               break;
           case 'ADMIN':
               canUpdate = true;
               break;
       }

       if (!canUpdate) {
           return res.status(403).json({
               success: false,
               error: 'You cannot update this batch status'
           });
       }

       // Update database
       const updatedBatch = await prisma.batch.update({
           where: { batchId: batchId },
           data: {
               status: status,
               notes: notes || batch.notes,
               updatedAt: new Date()
           }
       });

       // Update blockchain
       const { gateway, contract } = await blockchainService.connectToNetwork();
       if (contract) {
           try {
               const result = await blockchainService.submitTransactionWithRetry(
                   contract,
                   'updateBatchStatus',
                   [batchId, status, updatedBy || req.user.username, new Date().toISOString()]
               );
               await gateway.disconnect();
           } catch (blockchainError) {
               await gateway.disconnect();
               console.error('Blockchain update failed:', blockchainError);
               // Continue anyway - database is updated
           }
       }

       // Log activity
       await prisma.activityLog.create({
           data: {
               userId: req.user.id,
               action: 'UPDATE_BATCH_STATUS',
               resource: batchId,
               ipAddress: req.ip,
               userAgent: req.get('User-Agent'),
               metadata: { 
                   newStatus: status, 
                   oldStatus: batch.status,
                   notes: notes
               }
           }
       });

       res.json({
           success: true,
           batchId: batchId,
           newStatus: status,
           oldStatus: batch.status,
           updatedBy: updatedBy || req.user.username,
           updatedAt: updatedBatch.updatedAt,
           message: 'Batch status updated successfully'
       });

   } catch (error) {
       console.error('API error:', error);
       res.status(500).json({
           success: false,
           error: 'Internal server error'
       });
   }
});

// Get all batches (ENHANCED - Admin/Regulator only)
app.get('/api/batches', authenticate, authorize(['ADMIN', 'REGULATOR']), async (req, res) => {
   try {
       const { page = 1, limit = 10, status, farmer, crop } = req.query;
       const skip = (parseInt(page) - 1) * parseInt(limit);

       // Build where clause for filtering
       const where = {};
       if (status) where.status = status;
       if (crop) where.productType = { contains: crop, mode: 'insensitive' };
       if (farmer) {
           where.farmer = {
               user: {
                   username: { contains: farmer, mode: 'insensitive' }
               }
           };
       }

       // Get batches from database with pagination
       const batches = await prisma.batch.findMany({
           where,
           include: {
               farmer: {
                   include: {
                       user: { select: { username: true } }
                   }
               },
               farmLocation: true,
               _count: {
                   select: {
                       processingRecords: true,
                       transportRoutes: true,
                       qualityTests: true
                   }
               }
           },
           orderBy: { createdAt: 'desc' },
           skip: skip,
           take: parseInt(limit)
       });

       const totalCount = await prisma.batch.count({ where });

       // Also get blockchain data for comparison (if needed)
       let blockchainBatches = [];
       if (req.query.includeBlockchain === 'true') {
           const { gateway, contract } = await blockchainService.connectToNetwork();
           if (contract) {
               try {
                   const result = await contract.evaluateTransaction('getAllBatches');
                   blockchainBatches = JSON.parse(result.toString());
                   await gateway.disconnect();
               } catch (blockchainError) {
                   await gateway.disconnect();
                   console.error('Blockchain query failed:', blockchainError);
               }
           }
       }

       res.json({
           success: true,
           pagination: {
               page: parseInt(page),
               limit: parseInt(limit),
               totalCount,
               totalPages: Math.ceil(totalCount / parseInt(limit)),
               hasNext: skip + parseInt(limit) < totalCount,
               hasPrev: parseInt(page) > 1
           },
           filters: { status, farmer, crop },
           count: batches.length,
           batches: batches,
           ...(req.query.includeBlockchain === 'true' && {
               blockchainData: {
                   count: blockchainBatches.length,
                   batches: formatBlockchainDates(blockchainBatches)
               }
           })
       });

   } catch (error) {
       console.error('API error:', error);
       res.status(500).json({
           success: false,
           error: 'Internal server error'
       });
   }
});

// Get QR code for existing batch (ENHANCED)
app.get('/api/qr/:batchId', async (req, res) => {
   try {
       const { batchId } = req.params;
       const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';

       // Check if batch exists in database first
       const dbBatch = await prisma.batch.findUnique({
           where: { batchId: batchId },
           select: { batchId: true, status: true, qrCodeHash: true }
       });

       // Also check blockchain
       const { gateway, contract } = await blockchainService.connectToNetwork();
       let blockchainExists = false;
       
       if (contract) {
           try {
               await contract.evaluateTransaction('getBatch', batchId);
               blockchainExists = true;
               await gateway.disconnect();
           } catch (blockchainError) {
               await gateway.disconnect();
               blockchainExists = !blockchainError.message.includes('does not exist');
           }
       }

       if (!dbBatch && !blockchainExists) {
           return res.status(404).json({
               success: false,
               error: `Batch ${batchId} not found`
           });
       }

       // Generate QR code
       const qrCode = await blockchainService.generateQRCode(batchId);

       res.json({
           success: true,
           batchId: batchId,
           qrCode: qrCode,
           verificationUrl: `${FRONTEND_URL}/verify/${batchId}`,
           batchStatus: dbBatch?.status || 'unknown',
           sources: {
               database: !!dbBatch,
               blockchain: blockchainExists
           }
       });

   } catch (error) {
       console.error('API error:', error);
       res.status(500).json({
           success: false,
           error: 'Internal server error'
       });
   }
});

// Dashboard endpoint (NEW)
app.get('/api/dashboard', authenticate, async (req, res) => {
   try {
       let dashboardData = {};
       
       switch (req.user.role) {
           case 'FARMER':
               const farmerProfile = await prisma.farmerProfile.findUnique({
                   where: { userId: req.user.id },
                   include: {
                       batches: {
                           include: {
                               _count: {
                                   select: {
                                       processingRecords: true,
                                       transportRoutes: true
                                   }
                               }
                           }
                       },
                       farmLocations: true
                   }
               });
               
               dashboardData = {
                   farmerInfo: {
                       farmName: farmerProfile?.farmName,
                       farmSize: farmerProfile?.farmSize,
                       primaryCrops: farmerProfile?.primaryCrops
                   },
                   statistics: {
                       totalBatches: farmerProfile?.batches?.length || 0,
                       activeBatches: farmerProfile?.batches?.filter(b => 
                           ['REGISTERED', 'PROCESSING', 'IN_TRANSIT'].includes(b.status)
                       ).length || 0,
                       completedBatches: farmerProfile?.batches?.filter(b => 
                           ['DELIVERED', 'SOLD'].includes(b.status)
                       ).length || 0,
                       farmLocations: farmerProfile?.farmLocations?.length || 0
                   },
                   recentBatches: farmerProfile?.batches?.slice(0, 5) || []
               };
               break;
               
           case 'ADMIN':
               const totalUsers = await prisma.user.count();
               const totalBatches = await prisma.batch.count();
               const activeUsers = await prisma.user.count({
                   where: { status: 'ACTIVE' }
               });
               
               const usersByRole = await prisma.user.groupBy({
                   by: ['role'],
                   _count: { role: true }
               });
               
               const batchesByStatus = await prisma.batch.groupBy({
                   by: ['status'],
                   _count: { status: true }
               });
               
               dashboardData = {
                   systemStats: {
                       totalUsers,
                       totalBatches,
                       activeUsers,
                       usersByRole: usersByRole.reduce((acc, item) => {
                           acc[item.role] = item._count.role;
                           return acc;
                       }, {}),
                       batchesByStatus: batchesByStatus.reduce((acc, item) => {
                           acc[item.status] = item._count.status;
                           return acc;
                       }, {})
                   },
                   recentActivity: await prisma.activityLog.findMany({
                       take: 10,
                       orderBy: { timestamp: 'desc' },
                       include: {
                           user: {
                               select: { username: true, role: true }
                           }
                       }
                   })
               };
               break;
               
           default:
               dashboardData = {
                   message: 'Dashboard not configured for this role'
               };
       }
       
       res.json({
           success: true,
           user: {
               id: req.user.id,
               username: req.user.username,
               role: req.user.role,
               email: req.user.email
           },
           dashboard: dashboardData
       });
       
   } catch (error) {
       console.error('Dashboard error:', error);
       res.status(500).json({
           success: false,
           error: 'Failed to load dashboard'
       });
   }
});

// Data integrity check endpoint (NEW)
app.get('/api/batch/:batchId/integrity', authenticate, async (req, res) => {
   try {
       const { batchId } = req.params;
       
       // Get current database data
       const dbBatch = await prisma.batch.findUnique({
           where: { batchId: batchId }
       });
       
       if (!dbBatch) {
           return res.status(404).json({
               success: false,
               error: 'Batch not found in database'
           });
       }
       
       // Create current hash
       const currentHash = calculateStableHash(dbBatch);
           
       // Compare with stored hash
       const integrityValid = currentHash === dbBatch.dataHash;
       
       // Get blockchain verification if available
       const { gateway, contract } = await blockchainService.connectToNetwork();
       let blockchainVerification = null;
       
       if (contract) {
           try {
               const result = await contract.evaluateTransaction('verifyBatchIntegrity', batchId, currentHash);
               blockchainVerification = JSON.parse(result.toString());
               await gateway.disconnect();
           } catch (blockchainError) {
               await gateway.disconnect();
               console.error('Blockchain integrity check failed:', blockchainError);
           }
       }
       
       res.json({
           success: true,
           batchId: batchId,
           integrityCheck: {
               valid: integrityValid,
               storedHash: dbBatch.dataHash,
               currentHash: currentHash,
               lastModified: dbBatch.updatedAt,
               message: integrityValid ? 'Data integrity verified' : 'Data has been modified'
           },
           blockchainVerification: blockchainVerification,
           checkedAt: new Date().toISOString()
       });
       
   } catch (error) {
       console.error('Integrity check error:', error);
       res.status(500).json({
           success: false,
           error: 'Integrity check failed'
       });
   }
});

// ===============================
// PROCESSOR ENDPOINTS
// ===============================

// Get available batches for processing
app.get('/api/processor/available-batches', authenticate, authorize(['PROCESSOR']), async (req, res) => {
    try {
        const batches = await prisma.batch.findMany({
            where: {
                status: {
                    in: ['REGISTERED', 'PROCESSING']
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                farmer: {
                    select: {
                        firstName: true,
                        lastName: true,
                        farmName: true,
                        user: {
                            select: {
                                username: true
                            }
                        }
                    }
                }
            }
        });

        res.json({
            success: true,
            batches: batches,
            message: `Found ${batches.length} batches (available and in processing)`
        });

    } catch (error) {
        console.error('Get available batches error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch available batches'
        });
    }
});

// Process a batch
app.post('/api/processor/process/:batchId', authenticate, authorize(['PROCESSOR']), async (req, res) => {
    try {
        const { batchId } = req.params;
        const { processType, notes } = req.body;
        const processorId = req.user.id;

        // Find the batch
        const batch = await prisma.batch.findUnique({
            where: { batchId: batchId }
        });

        if (!batch) {
            return res.status(404).json({
                success: false,
                error: 'Batch not found'
            });
        }

        if (batch.status !== 'REGISTERED') {
            return res.status(400).json({
                success: false,
                error: `Cannot process batch with status: ${batch.status}`
            });
        }

        // Update batch status to PROCESSING
        const updatedBatch = await prisma.batch.update({
            where: { batchId: batchId },
            data: {
                status: 'PROCESSING',
                updatedAt: new Date()
            }
        });

        // Get the processor profile ID
        const processorProfile = await prisma.processorProfile.findUnique({
            where: {
                userId: processorId
            }
        });

        if (!processorProfile) {
            return res.status(400).json({
                success: false,
                error: 'Processor profile not found'
            });
        }

        // Find or create a default processing facility for this processor
        let facility = await prisma.processingFacility.findFirst({
            where: {
                processorId: processorProfile.id,
                isActive: true
            }
        });

        if (!facility) {
            // Create a default facility if none exists
            facility = await prisma.processingFacility.create({
                data: {
                    processorId: processorProfile.id,
                    facilityName: `${req.user.username}'s Processing Facility`,
                    facilityType: 'processing',
                    latitude: 0.0, // Default coordinates, can be updated later
                    longitude: 0.0,
                    address: 'Not specified',
                    isActive: true,
                    certifications: [],
                    equipmentList: []
                }
            });
        }

        // Create processing record
        const processingRecord = await prisma.processingRecord.create({
            data: {
                batchId: batch.id,
                processorId: processorProfile.id,
                facilityId: facility.id,
                processingDate: new Date(),
                processingType: processType || 'initial_processing',
                inputQuantity: batch.quantity,
                outputQuantity: batch.quantity, // Will be updated when processing completes
                operatorName: req.user.username
            }
        });

        // Update blockchain
        try {
            const { gateway, contract } = await blockchainService.connectToNetwork();
            await contract.submitTransaction(
                'updateBatchStatus',
                batchId,
                'PROCESSING',
                req.user.username,
                new Date().toISOString()
            );
            await gateway.disconnect();
            console.log(`✅ Blockchain updated: Batch ${batchId} set to PROCESSING`);
        } catch (blockchainError) {
            console.error('Blockchain update failed:', blockchainError);
        }

        res.json({
            success: true,
            batch: updatedBatch,
            processingRecord: processingRecord,
            message: 'Batch processing started successfully'
        });

    } catch (error) {
        console.error('Process batch error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to start batch processing'
        });
    }
});

// Get processor's processing history
app.get('/api/processor/my-processing', authenticate, authorize(['PROCESSOR']), async (req, res) => {
    try {
        const processorId = req.user.id;

        // Get the processor profile ID
        const processorProfile = await prisma.processorProfile.findUnique({
            where: {
                userId: processorId
            }
        });

        if (!processorProfile) {
            return res.status(400).json({
                success: false,
                error: 'Processor profile not found'
            });
        }

        const processingHistory = await prisma.processingRecord.findMany({
            where: {
                processorId: processorProfile.id
            },
            orderBy: {
                processingDate: 'desc'
            },
            include: {
                batch: {
                    select: {
                        batchId: true,
                        productType: true,
                        variety: true,
                        status: true
                    }
                }
            }
        });

        // Transform data for frontend
        const history = processingHistory.map(record => ({
            id: record.id,
            batchId: record.batch?.batchId || record.batchId,
            productType: record.batch?.productType || 'Unknown',
            variety: record.batch?.variety,
            processType: record.processingType,
            processDate: record.processingDate,
            createdAt: record.processingDate, // For compatibility with dashboard
            status: 'COMPLETED', // ProcessingRecord doesn't have a status field in our schema
            notes: record.operatorName ? `Processed by ${record.operatorName}` : 'Processing completed'
        }));

        res.json({
            success: true,
            history: history,
            message: `Found ${history.length} processing records`
        });

    } catch (error) {
        console.error('Get processing history error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch processing history'
        });
    }
});

// Complete processing for a batch
app.put('/api/processor/complete/:batchId', authenticate, authorize(['PROCESSOR']), async (req, res) => {
    try {
        const { batchId } = req.params;
        const { qualityGrade, completionNotes } = req.body;
        const processorId = req.user.id;

        // Get the processor profile ID
        const processorProfile = await prisma.processorProfile.findUnique({
            where: {
                userId: processorId
            }
        });

        if (!processorProfile) {
            return res.status(400).json({
                success: false,
                error: 'Processor profile not found'
            });
        }

        // Find the batch
        const batch = await prisma.batch.findUnique({
            where: { batchId: batchId }
        });

        if (!batch) {
            return res.status(404).json({
                success: false,
                error: 'Batch not found'
            });
        }

        if (batch.status !== 'PROCESSING') {
            return res.status(400).json({
                success: false,
                error: `Cannot complete batch with status: ${batch.status}`
            });
        }

        // Update batch status to PROCESSED
        const updatedBatch = await prisma.batch.update({
            where: { batchId: batchId },
            data: {
                status: 'PROCESSED',
                qualityGrade: qualityGrade,
                updatedAt: new Date()
            }
        });

        // Update processing record - update the most recent processing record for this batch and processor
        const mostRecentRecord = await prisma.processingRecord.findFirst({
            where: {
                batch: {
                    batchId: batchId
                },
                processorId: processorProfile.id
            },
            orderBy: {
                processingDate: 'desc'
            }
        });

        if (mostRecentRecord) {
            await prisma.processingRecord.update({
                where: {
                    id: mostRecentRecord.id
                },
                data: {
                    outputQuantity: batch.quantity, // Update final output quantity
                    operatorName: `${req.user.username} (completed)`,
                    qualityTests: qualityGrade ? JSON.stringify({ grade: qualityGrade, notes: completionNotes }) : null
                }
            });
        }

        // Update blockchain
        try {
            const { gateway, contract } = await blockchainService.connectToNetwork();
            await contract.submitTransaction(
                'updateBatchStatus',
                batchId,
                'PROCESSED',
                req.user.username,
                new Date().toISOString(),
                JSON.stringify({
                    processedBy: req.user.username,
                    processorId: processorId,
                    completionDate: new Date().toISOString(),
                    qualityGrade: qualityGrade,
                    notes: completionNotes
                })
            );
            await gateway.disconnect();
            console.log(`✅ Blockchain updated: Batch ${batchId} completed processing`);
        } catch (blockchainError) {
            console.error('Blockchain update failed:', blockchainError);
        }

        res.json({
            success: true,
            batch: updatedBatch,
            message: 'Batch processing completed successfully'
        });

    } catch (error) {
        console.error('Complete processing error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to complete batch processing'
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
   console.error('Unhandled error:', err);
   res.status(500).json({
       success: false,
       error: 'Internal server error',
       details: process.env.NODE_ENV === 'development' ? err.message : undefined
   });
});

// 404 handler
app.use('*', (req, res) => {
   res.status(404).json({
       success: false,
       error: 'Endpoint not found'
   });
});

// Graceful shutdown
process.on('SIGINT', async () => {
   console.log('\n🔄 Gracefully shutting down...');
   
   try {
       await prisma.$disconnect();
       console.log('✅ Database disconnected');
   } catch (error) {
       console.error('❌ Error disconnecting database:', error);
   }
   
   process.exit(0);
});

// Start server
const startServer = async () => {
   try {
       // Test database connection
       await prisma.$connect();
       console.log('✅ Database connected successfully');
       
       // Test blockchain connection
       const { gateway, contract } = await blockchainService.connectToNetwork();
       const blockchainStatus = contract ? '✅ Blockchain connected successfully' : '⚠️  Blockchain connection failed';
       console.log(blockchainStatus);
       if (gateway) await gateway.disconnect();
       
       app.listen(PORT, '0.0.0.0', () => {
           console.log('🚀 Agricultural Supply Chain API Server with Database Integration Started');
           console.log(`📡 Server running on: http://localhost:${PORT}`);
           console.log(`🗃️  Database: PostgreSQL with Prisma ORM`);
           console.log(`🔗 Blockchain network: mychannel`);
           console.log(`📦 Smart contract: agricultural-contract`);
           console.log(`🌐 Enhanced API Endpoints:`);
           console.log(`   Authentication:`);
           console.log(`     POST /api/auth/register      - Register new user`);
           console.log(`     POST /api/auth/login         - Login user`);
           console.log(`     GET  /api/auth/profile       - Get user profile`);
           console.log(`   Batch Management:`);
           console.log(`     POST /api/batch/create       - Create new crop batch (Farmers)`);
           console.log(`     GET  /api/batch/:batchId     - Get batch details (Role-based)`);
           console.log(`     PUT  /api/batch/:id/status   - Update batch status`);
           console.log(`     GET  /api/farmer/my-batches  - Get farmer's batches`);
           console.log(`   Processor Operations:`);
           console.log(`     GET  /api/processor/available-batches - Get available batches (Processors)`);
           console.log(`     POST /api/processor/process/:batchId  - Start batch processing`);
           console.log(`     GET  /api/processor/my-processing     - Get processing history`);
           console.log(`     PUT  /api/processor/complete/:batchId - Complete batch processing`);
           console.log(`   Verification & QR:`);
           console.log(`     GET  /api/verify/:batchId    - Verify batch (QR scan)`);
           console.log(`     GET  /api/qr/:batchId        - Get QR code for batch`);
           console.log(`   Admin & Analytics:`);
           console.log(`     GET  /api/batches            - Get all batches (Admin/Regulator)`);
           console.log(`     GET  /api/dashboard          - Role-based dashboard`);
           console.log(`     GET  /api/batch/:id/integrity - Data integrity check`);
           console.log(`   System:`);
           console.log(`     GET  /                       - API health check`);
           console.log(`     GET  /api/batch/check/:id    - Check batch existence`);
           console.log('');
           console.log('🔐 Authentication: Bearer JWT token required for protected endpoints');
           console.log('📊 Database & Blockchain: Hybrid storage with cross-verification');
           console.log('🛡️  Security: Role-based access control + data integrity checks');
           console.log('');
           console.log('💡 Test with: curl http://localhost:3000');
       });
       
   } catch (error) {
       console.error('❌ Server startup failed:', error);
       process.exit(1);
   }
};

startServer();

module.exports = app;