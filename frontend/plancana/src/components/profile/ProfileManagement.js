import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api'; // Add this import
import api from '../../services/api'; // Add this line

const ProfileManagement = () => {
    const { user, updateUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [profileData, setProfileData] = useState({});
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            setErrors({});
            console.log('Fetching profile...');
            
            // Use authService instead of direct api call
            const response = await authService.getProfile();
            console.log('Profile response:', response.data);
            
            if (response.data.success) {
                const profile = response.data.user;
                console.log('User profile:', profile);
                console.log('Farmer profile:', profile.farmerProfile);
                
                // Set profile data based on user role
                if (profile.role === 'FARMER' && profile.farmerProfile) {
                    const farmerData = {
                        firstName: profile.farmerProfile.firstName || '',
                        lastName: profile.farmerProfile.lastName || '',
                        phone: profile.farmerProfile.phone || '',
                        farmName: profile.farmerProfile.farmName || '',
                        farmSize: profile.farmerProfile.farmSize || '',
                        address: profile.farmerProfile.address || '',
                        state: profile.farmerProfile.state || '',
                        primaryCrops: profile.farmerProfile.primaryCrops || [],
                        farmingType: profile.farmerProfile.farmingType || [],
                        certifications: profile.farmerProfile.certifications || [],
                        licenseNumber: profile.farmerProfile.licenseNumber || '',
                        profileImage: profile.farmerProfile.profileImage || ''
                    };
                    
                    console.log('Setting profile data:', farmerData);
                    setProfileData(farmerData);
                    setImagePreview(profile.farmerProfile.profileImage);
                    
                } else if (profile.role === 'PROCESSOR' && profile.processorProfile) {
                    const processorData = {
                        companyName: profile.processorProfile.companyName || '',
                        contactPerson: profile.processorProfile.contactPerson || '',
                        phone: profile.processorProfile.phone || '',
                        email: profile.processorProfile.email || '',
                        address: profile.processorProfile.address || '',
                        state: profile.processorProfile.state || '',
                        facilityType: profile.processorProfile.facilityType || [],
                        processingCapacity: profile.processorProfile.processingCapacity || '',
                        certifications: profile.processorProfile.certifications || [],
                        licenseNumber: profile.processorProfile.licenseNumber || '',
                        profileImage: profile.processorProfile.profileImage || ''
                    };
                    
                    console.log('Setting processor profile data:', processorData);
                    setProfileData(processorData);
                    setImagePreview(profile.processorProfile.profileImage);
                    
                } else if (profile.role === 'ADMIN' && profile.adminProfile) {
                    const adminData = {
                        firstName: profile.adminProfile.firstName || '',
                        lastName: profile.adminProfile.lastName || '',
                        phone: profile.adminProfile.phone || '',
                        email: profile.adminProfile.email || '',
                        adminLevel: profile.adminProfile.adminLevel || 'MODERATOR',
                        permissions: profile.adminProfile.permissions || [],
                        profileImage: profile.adminProfile.profileImage || ''
                    };
                    
                    console.log('Setting admin profile data:', adminData);
                    setProfileData(adminData);
                    setImagePreview(profile.adminProfile.profileImage);
                    
                } else {
                    console.log('No profile found for user role:', profile.role);
                    setErrors({ 
                        general: `No ${profile.role.toLowerCase()} profile found. Please contact administrator.` 
                    });
                }
            } else {
                console.error('Profile fetch failed:', response.data);
                setErrors({ 
                    general: response.data.error || 'Failed to fetch profile data' 
                });
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error);
            console.error('Error details:', error.response?.data);
            
            if (error.response?.status === 401) {
                setErrors({ 
                    general: 'Authentication failed. Please log in again.' 
                });
            } else if (error.response?.status === 404) {
                setErrors({ 
                    general: 'Profile not found. Please contact administrator.' 
                });
            } else if (error.response?.data?.error) {
                setErrors({ 
                    general: error.response.data.error 
                });
            } else {
                setErrors({ 
                    general: 'Failed to load profile data. Please try again.' 
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleArrayInputChange = (field, value) => {
        const array = value.split(',').map(item => item.trim()).filter(item => item);
        setProfileData(prev => ({
            ...prev,
            [field]: array
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadImage = async () => {
        if (!imageFile) return null;

        const formData = new FormData();
        formData.append('avatar', imageFile);

        try {
            const response = await api.post('/auth/profile/avatar', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            if (response.data.success) {
                return response.data.imageUrl;
            }
        } catch (error) {
            console.error('Image upload failed:', error);
            throw error;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            // Upload image first if there's a new one
            let imageUrl = profileData.profileImage;
            if (imageFile) {
                imageUrl = await uploadImage();
            }

            // Update profile data
            const updatedProfileData = {
                ...profileData,
                profileImage: imageUrl
            };

            const response = await api.put('/auth/profile', {
                profileData: updatedProfileData,
                personalData: {
                    email: user.email, // Keep current email for now
                    username: user.username // Keep current username for now
                }
            });

            if (response.data.success) {
                setIsEditing(false);
                setImageFile(null);
                await fetchProfile(); // Refresh profile data
                alert('Profile updated successfully!');
            }
        } catch (error) {
            console.error('Profile update failed:', error);
            if (error.response?.data?.error) {
                setErrors({ general: error.response.data.error });
            } else {
                setErrors({ general: 'Failed to update profile' });
            }
        } finally {
            setLoading(false);
        }
    };

    const renderFarmerProfile = () => (
        <div className="space-y-4">
            {/* Profile Picture */}
            <div className="flex items-center space-x-4">
                <div className="relative">
                    <img
                        src={
                            imagePreview
                              ? imagePreview.startsWith('http') 
                                ? imagePreview 
                                : `http://localhost:3000${imagePreview}`
                              : '/default-avatar.png'
                          }
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
                    />
                    {isEditing && (
                        <label className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center cursor-pointer text-xs">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                            />
                            📷
                        </label>
                    )}
                </div>
                <div>
                    <h3 className="text-lg font-medium">{profileData.firstName} {profileData.lastName}</h3>
                    <p className="text-gray-600">{profileData.farmName}</p>
                </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    <input
                        type="text"
                        name="firstName"
                        value={profileData.firstName}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    <input
                        type="text"
                        name="lastName"
                        value={profileData.lastName}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                        type="tel"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Farm Name</label>
                    <input
                        type="text"
                        name="farmName"
                        value={profileData.farmName}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Farm Size (hectares)</label>
                    <input
                        type="number"
                        name="farmSize"
                        value={profileData.farmSize}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">State</label>
                    <select
                        name="state"
                        value={profileData.state}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100"
                    >
                        <option value="">Select State</option>
                        <option value="Johor">Johor</option>
                        <option value="Kedah">Kedah</option>
                        <option value="Kelantan">Kelantan</option>
                        <option value="Melaka">Melaka</option>
                        <option value="Negeri Sembilan">Negeri Sembilan</option>
                        <option value="Pahang">Pahang</option>
                        <option value="Perak">Perak</option>
                        <option value="Perlis">Perlis</option>
                        <option value="Pulau Pinang">Pulau Pinang</option>
                        <option value="Sabah">Sabah</option>
                        <option value="Sarawak">Sarawak</option>
                        <option value="Selangor">Selangor</option>
                        <option value="Terengganu">Terengganu</option>
                        <option value="Kuala Lumpur">Kuala Lumpur</option>
                        <option value="Labuan">Labuan</option>
                        <option value="Putrajaya">Putrajaya</option>
                    </select>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <textarea
                        name="address"
                        value={profileData.address}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Primary Crops (comma-separated)</label>
                    <input
                        type="text"
                        value={profileData.primaryCrops?.join(', ')}
                        onChange={(e) => handleArrayInputChange('primaryCrops', e.target.value)}
                        disabled={!isEditing}
                        placeholder="Rice, Corn, Palm Oil"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Farming Type (comma-separated)</label>
                    <input
                        type="text"
                        value={profileData.farmingType?.join(', ')}
                        onChange={(e) => handleArrayInputChange('farmingType', e.target.value)}
                        disabled={!isEditing}
                        placeholder="Organic, Conventional, Hydroponic"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">License Number</label>
                    <input
                        type="text"
                        name="licenseNumber"
                        value={profileData.licenseNumber}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Certifications (comma-separated)</label>
                    <input
                        type="text"
                        value={profileData.certifications?.join(', ')}
                        onChange={(e) => handleArrayInputChange('certifications', e.target.value)}
                        disabled={!isEditing}
                        placeholder="Organic, HACCP, ISO"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100"
                    />
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">Profile Management</h2>
                    <div className="space-x-2">
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                Edit Profile
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setImageFile(null);
                                        fetchProfile(); // Reset data
                                    }}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
                                >
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="p-6">
                    {errors.general && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                            {errors.general}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {user?.role === 'FARMER' && renderFarmerProfile()}
                        {/* Add other role profiles here */}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProfileManagement;