'use client';

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
        <div className="space-y-8">
            {/* Profile Picture Section */}
            <div className="bg-gray-50 rounded-2xl p-6">
                <div className="flex items-center space-x-6">
                    <div className="relative">
                        <img
                            src={
                                imagePreview
                                  ? imagePreview.startsWith('http') 
                                    ? imagePreview 
                                    : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${imagePreview}`
                                  : '/default-avatar.png'
                              }
                            alt="Profile"
                            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                        />
                        {isEditing && (
                            <label className="absolute bottom-0 right-0 bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-green-600 transition-colors shadow-lg">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </label>
                        )}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900">{profileData.firstName} {profileData.lastName}</h3>
                        <p className="text-lg text-green-600 font-medium mt-1">{profileData.farmName}</p>
                        <p className="text-gray-500 text-sm mt-1">Farmer • {profileData.state}</p>
                    </div>
                </div>
            </div>

            {/* Personal Information */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6">
                <h4 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Personal Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">First Name</label>
                        <input
                            type="text"
                            name="firstName"
                            value={profileData.firstName}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:text-gray-500 transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Last Name</label>
                        <input
                            type="text"
                            name="lastName"
                            value={profileData.lastName}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:text-gray-500 transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Phone Number</label>
                        <input
                            type="tel"
                            name="phone"
                            value={profileData.phone}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            placeholder="Enter your phone number"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:text-gray-500 transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">State</label>
                        <select
                            name="state"
                            value={profileData.state}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:text-gray-500 transition-colors bg-white"
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

                    <div className="md:col-span-2 space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Address</label>
                        <textarea
                            name="address"
                            value={profileData.address}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            rows={3}
                            placeholder="Enter your complete address"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:text-gray-500 transition-colors resize-none"
                        />
                    </div>
                </div>
            </div>

            {/* Farm Information */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6">
                <h4 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Farm Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Farm Name</label>
                        <input
                            type="text"
                            name="farmName"
                            value={profileData.farmName}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            placeholder="Enter your farm name"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:text-gray-500 transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Farm Size (hectares)</label>
                        <input
                            type="number"
                            name="farmSize"
                            value={profileData.farmSize}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            placeholder="Enter farm size in hectares"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:text-gray-500 transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Primary Crops</label>
                        <input
                            type="text"
                            value={profileData.primaryCrops?.join(', ')}
                            onChange={(e) => handleArrayInputChange('primaryCrops', e.target.value)}
                            disabled={!isEditing}
                            placeholder="Rice, Corn, Palm Oil"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:text-gray-500 transition-colors"
                        />
                        <p className="text-xs text-gray-500">Separate multiple crops with commas</p>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Farming Type</label>
                        <input
                            type="text"
                            value={profileData.farmingType?.join(', ')}
                            onChange={(e) => handleArrayInputChange('farmingType', e.target.value)}
                            disabled={!isEditing}
                            placeholder="Organic, Conventional, Hydroponic"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:text-gray-500 transition-colors"
                        />
                        <p className="text-xs text-gray-500">Separate multiple types with commas</p>
                    </div>
                </div>
            </div>

            {/* Certifications & Licensing */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6">
                <h4 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <svg className="w-6 h-6 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    Certifications & Licensing
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">License Number</label>
                        <input
                            type="text"
                            name="licenseNumber"
                            value={profileData.licenseNumber}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            placeholder="Enter your farming license number"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:text-gray-500 transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Certifications</label>
                        <input
                            type="text"
                            value={profileData.certifications?.join(', ')}
                            onChange={(e) => handleArrayInputChange('certifications', e.target.value)}
                            disabled={!isEditing}
                            placeholder="Organic, HACCP, ISO"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:text-gray-500 transition-colors"
                        />
                        <p className="text-xs text-gray-500">Separate multiple certifications with commas</p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header Card */}
                <div className="bg-white shadow-xl rounded-2xl mb-8 overflow-hidden">
                    <div className="bg-gradient-to-r from-green-500 to-green-600 px-8 py-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-3xl font-bold text-white">Profile Management</h1>
                                <p className="text-green-100 mt-1">Manage your account information and preferences</p>
                            </div>
                            <div className="flex space-x-3">
                                {!isEditing ? (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="px-6 py-3 bg-white text-green-600 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-green-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                                    >
                                        <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Edit Profile
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => {
                                                setIsEditing(false);
                                                setImageFile(null);
                                                fetchProfile();
                                            }}
                                            className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all duration-200 disabled:opacity-50"
                                            disabled={loading}
                                        >
                                            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={loading}
                                            className="px-6 py-3 bg-white text-green-600 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-green-600 transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl"
                                        >
                                            {loading ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-green-600 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Save Changes
                                                </>
                                            )}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Card */}
                <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
                    <div className="p-8">
                        {errors.general && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-red-800">
                                            {errors.general}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            {user?.role === 'FARMER' && renderFarmerProfile()}
                            {/* Add other role profiles here */}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileManagement;