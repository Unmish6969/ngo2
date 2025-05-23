'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import './style.css';
import { authService } from '../services/authService';
import { membersService, Member, MemberCreate, MemberUpdate } from '../services/membersService';
import {
  Globe,
  Info,
  FileText,
  Users,
  Mail,
  Menu,
  X,
  Trash2,
  Edit,
  Plus,
  Save,
  Search,
  Image as ImageIcon,
  Camera,
  ArrowLeft,
  ArrowRight,
  Check,
  Heart
} from 'lucide-react';
import { API_URL, getImageUrl } from '../../utils/api';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
}

const navItems: NavItem[] = [
  { label: 'Home', icon: <Globe size={20} />, href: '/' },
  { label: 'About Us', icon: <Info size={20} />, href: '/about' },
  { label: 'Media', icon: <FileText size={20} />, href: '/media' },
  { label: 'Space Community', icon: <Users size={20} />, href: '/community' },
  { label: 'Donate', icon: <Heart size={20} />, href: '/donate_us' },
  { label: 'Contact us', icon: <Mail size={20} />, href: '/contact' },
];

export default function MemberControlPage() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // New member form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMember, setNewMember] = useState<Partial<MemberCreate>>({
    name: '',
    position: '',
    age: 25,
    photo: null,
    bio: ''
  });
  
  // Edit member state
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // Flashcard states
  const [showFlashcard, setShowFlashcard] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Add a state to track the selected image file
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  
  // Check authentication on page load
  useEffect(() => {
    // Remove this check since it's now handled by middleware and layout
    // if (!authService.isAuthenticated()) {
    //   router.push('/login');
    //   return;
    // }
    
    fetchMembers();
  }, []);
  
  // Fetch members from backend API
  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/members/members/`);
      
      if (!response.ok) {
        // If the response isn't OK, try to get more details from the error
        let errorMsg = 'Failed to fetch members';
        try {
          const errorData = await response.json();
          errorMsg = errorData.detail || errorMsg;
        } catch (e) {
          // If we can't parse JSON, use status text
          errorMsg = `${errorMsg}: ${response.statusText}`;
        }
        throw new Error(errorMsg);
      }
      
      const data = await response.json();
      setMembers(data);
      setError(null);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error loading members. Please try again later.');
      }
      console.error('Error fetching members:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  // Filter members based on search term
  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.position.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Handle new member form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewMember({
      ...newMember,
      [name]: name === 'age' ? parseInt(value) || 0 : value
    });
  };
  
  // Handle edit member form input changes
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editingMember) return;
    
    const { name, value } = e.target;
    setEditingMember({
      ...editingMember,
      [name]: name === 'age' ? parseInt(value) || 0 : value
    });
  };
  
  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Save the file for later upload
    setSelectedImageFile(file);
    
    // Create a preview URL for display
    const objectUrl = URL.createObjectURL(file);
    setPreviewImage(objectUrl);
    
    // Update the form data (note we don't set the actual file here)
    setNewMember({
      ...newMember,
      photo: objectUrl // This is just for preview
    });
  };
  
  // Add a new member
  const handleAddMember = async () => {
    try {
      if (!newMember.name || !newMember.position) {
        setError('Name and position are required');
        return;
      }
      
      // Get the token from localStorage for authentication
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please log in first.');
      }
      
      // Make sure age is a number
      const age = typeof newMember.age === 'number' ? newMember.age : 
        parseInt(String(newMember.age ?? '')) || 25;
      
      // Use direct fetch with FormData for image upload
      if (selectedImageFile) {
        console.log('Selected image file:', selectedImageFile.name, selectedImageFile.type, selectedImageFile.size);
        
        const formData = new FormData();
        formData.append('name', newMember.name);
        formData.append('position', newMember.position);
        formData.append('age', age.toString());
        
        if (newMember.bio) {
          formData.append('bio', newMember.bio);
        }
        
        formData.append('image', selectedImageFile);
        
        // Log form data entries for debugging
        console.log('Form data entries:');
        for (let [key, value] of formData.entries()) {
          if (value instanceof File) {
            console.log(key, ':', value.name, value.type, value.size);
          } else {
            console.log(key, ':', value);
          }
        }
        
        const apiUrl = `${API_URL}/api/members/members/with-image`;
        console.log('Adding member with image, API URL:', apiUrl);
        
        try {
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData,
            mode: 'cors',
            credentials: 'same-origin',
          });
          
          console.log('Response status:', response.status);
          
          if (!response.ok) {
            // If the response isn't OK, try to get more details from the error
            let errorMsg = 'Failed to create member';
            let responseText = await response.text();
            console.error('Raw response:', responseText);
            
            try {
              const errorData = JSON.parse(responseText);
              errorMsg = errorData.detail || errorMsg;
            } catch (e) {
              // If we can't parse JSON, use status text
              errorMsg = `${errorMsg}: ${response.statusText}`;
            }
            console.error('Error response:', errorMsg, response.status);
            throw new Error(errorMsg);
          }
          
          // Response was OK
          const responseData = await response.json();
          console.log('Success response data:', responseData);
          
        } catch (fetchError) {
          console.error('Fetch error:', fetchError);
          throw fetchError;
        }
      } else {
        // No image, use regular JSON endpoint
        console.log('Adding member without image, API URL:', `${API_URL}/api/members/members/`);
        
        const response = await fetch(`${API_URL}/api/members/members/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: newMember.name,
            position: newMember.position,
            age,
            bio: newMember.bio || ''
          }),
          mode: 'cors',
          credentials: 'same-origin',
        });
        
        if (!response.ok) {
          // If the response isn't OK, try to get more details from the error
          let errorMsg = 'Failed to create member';
          try {
            const errorData = await response.json();
            errorMsg = errorData.detail || errorMsg;
          } catch (e) {
            // If we can't parse JSON, use status text
            errorMsg = `${errorMsg}: ${response.statusText}`;
          }
          console.error('Error response:', errorMsg, response.status);
          throw new Error(errorMsg);
        }
      }
      
      // Reset states
      setNewMember({
        name: '',
        position: '',
        age: 25,
        photo: null,
        bio: ''
      });
      setSelectedImageFile(null);
      setPreviewImage(null);
      setShowFlashcard(false);
      setCurrentStep(0);
      setError(null);
      
      // Refresh the members list
      fetchMembers();
      
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
      console.error('Error adding member:', err);
    }
  };
  
  // Delete a member
  const handleDeleteMember = async (id: number) => {
    if (!confirm('Are you sure you want to delete this member?')) {
      return;
    }
    
    try {
      // Get the token from localStorage for authentication
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please log in first.');
      }
      
      const response = await fetch(`${API_URL}/api/members/members/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // For DELETE operations, a 204 No Content response is success
      if (!response.ok) {
        // If the response isn't OK, try to get more details from the error
        let errorMsg = 'Failed to delete member';
        try {
          const errorData = await response.json();
          errorMsg = errorData.detail || errorMsg;
        } catch (e) {
          // If we can't parse JSON, use status text
          errorMsg = `${errorMsg}: ${response.statusText}`;
        }
        throw new Error(errorMsg);
      }
      
      // Successfully deleted, refresh the members list
      setError(null);
      fetchMembers();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
      console.error('Error deleting member:', err);
    }
  };
  
  // Edit a member
  const handleEditMember = (member: Member) => {
    setEditingMember(member);
  };
  
  // Save edited member
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingMember) return;
    
    try {
      // Get the token from localStorage for authentication
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please log in first.');
      }
      
      const response = await fetch(`${API_URL}/api/members/members/${editingMember.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editingMember.name,
          position: editingMember.position,
          age: editingMember.age,
          bio: editingMember.bio
        })
      });
      
      if (!response.ok) {
        // If the response isn't OK, try to get more details from the error
        let errorMsg = 'Failed to update member';
        try {
          const errorData = await response.json();
          errorMsg = errorData.detail || errorMsg;
        } catch (e) {
          // If we can't parse JSON, use status text
          errorMsg = `${errorMsg}: ${response.statusText}`;
        }
        throw new Error(errorMsg);
      }
      
      // Reset editing state and refresh members
      setEditingMember(null);
      setError(null);
      fetchMembers();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
      console.error('Error updating member:', err);
    }
  };
  
  // Handle next and previous in flashcard steps
  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit the form on the last step
      handleAddMember();
    }
  };
  
  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      setShowFlashcard(false);
    }
  };
  
  // Open file dialog
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Render the current flashcard step
  const renderFlashcardStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="flashcard-step">
            <h3>Upload Photo</h3>
            <div 
              className="image-upload-area"
              onClick={triggerFileInput}
            >
              {previewImage ? (
                <div className="preview-container">
                  <img 
                    src={previewImage} 
                    alt="Preview" 
                    className="image-preview" 
                  />
                </div>
              ) : (
                <div className="upload-placeholder">
                  <Camera size={48} />
                  <p>Click to upload photo</p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="hidden-file-input"
              />
            </div>
          </div>
        );
      case 1:
        return (
          <div className="flashcard-step">
            <h3>Basic Information</h3>
            <div className="flashcard-form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={newMember.name}
                onChange={handleInputChange}
                placeholder="Enter full name"
                required
              />
            </div>
            
            <div className="flashcard-form-group">
              <label htmlFor="position">Position</label>
              <input
                type="text"
                id="position"
                name="position"
                value={newMember.position}
                onChange={handleInputChange}
                placeholder="Enter position/role"
                required
              />
            </div>
            
            <div className="flashcard-form-group">
              <label htmlFor="age">Age</label>
              <input
                type="number"
                id="age"
                name="age"
                min="18"
                max="100"
                value={newMember.age}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="flashcard-step">
            <h3>Bio</h3>
            <div className="flashcard-form-group">
              <label htmlFor="bio">Professional Bio</label>
              <textarea
                id="bio"
                name="bio"
                value={newMember.bio ?? ''}
                onChange={handleInputChange}
                placeholder="Write a brief professional bio..."
                required
                rows={6}
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="flashcard-step">
            <h3>Preview</h3>
            <div className="member-preview">
              <div className="preview-photo">
                <img 
                  src={previewImage || newMember.photo || undefined} 
                  alt={newMember.name || "New member"} 
                />
              </div>
              <div className="preview-info">
                <h4>{newMember.name || "Name"}</h4>
                <p className="preview-position">{newMember.position || "Position"}</p>
                <div className="preview-details">
                  <span className="preview-age">
                    <strong>Age:</strong> {newMember.age}
                  </span>
                </div>
                <p className="preview-bio">{newMember.bio || "Bio will appear here"}</p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };
  
  return (
    <main className="main-content">
      <div className="header-container">
        <Link href="/" className="logo-container">
          <Image
            src="/logo.png"
            alt="Logo"
            width={80}
            height={80}
            className="logo-image"
          />
        </Link>

        <nav className="navbar">
          <button className="menu-toggle" onClick={toggleMenu}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <div className={`nav-items ${isMenuOpen ? 'show' : ''}`}>
            {navItems.map((item, index) => (
              <Link 
                key={index} 
                href={item.href} 
                className="nav-item"
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="nav-icon">{item.icon}</div>
                <span className="nav-label">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>

      <div className="member-control-content">
        <div className="section-title-container">
          <h2>Member <span className="highlight">Management</span></h2>
          <button 
            className="add-member-btn"
            onClick={() => setShowFlashcard(true)}
          >
            Add New Member
            <Plus size={20} />
          </button>
        </div>
        
        {error && (
          <div className="error-alert">
            <p>{error}</p>
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}
        
        {/* Flashcard Form */}
        {showFlashcard && (
          <div className="flashcard-overlay">
            <div className="flashcard-container">
              <button className="flashcard-close-btn" onClick={() => setShowFlashcard(false)}>
                <X size={24} />
              </button>
              
              <div className="flashcard-progress">
                {[0, 1, 2, 3].map(step => (
                  <div 
                    key={step} 
                    className={`progress-step ${currentStep === step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}
                  >
                    {currentStep > step ? <Check size={16} /> : step + 1}
                  </div>
                ))}
              </div>
              
              {renderFlashcardStep()}
              
              <div className="flashcard-navigation">
                <button 
                  className="flashcard-nav-btn prev-btn" 
                  onClick={handlePrevStep}
                >
                  <ArrowLeft size={16} />
                  {currentStep === 0 ? 'Cancel' : 'Previous'}
                </button>
                <button 
                  className="flashcard-nav-btn next-btn" 
                  onClick={handleNextStep}
                >
                  {currentStep === 3 ? 'Submit' : 'Next'}
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Search box */}
        <div className="search-container">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search members..."
              className="search-input"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {/* Members list */}
        {isLoading ? (
          <div className="loading">Loading members...</div>
        ) : (
          <div className="members-table-container">
            {filteredMembers.length > 0 ? (
              <table className="members-table">
                <thead>
                  <tr>
                    <th>Photo</th>
                    <th>Name</th>
                    <th>Position</th>
                    <th>Age</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map(member => (
                    <tr key={member.id}>
                      <td className="member-photo-cell">
                        <img 
                          src={member.photo 
                            ? member.photo.startsWith('http') 
                              ? member.photo 
                              : getImageUrl(member.photo) 
                            : '/owner.png'} 
                          alt={member.name} 
                          className="table-member-photo" 
                        />
                      </td>
                      <td>{member.name}</td>
                      <td>{member.position}</td>
                      <td>{member.age}</td>
                      <td className="action-buttons">
                        <button 
                          className="edit-btn" 
                          onClick={() => handleEditMember(member)}
                        >
                          <Edit size={16} />
                          Edit
                        </button>
                        <button 
                          className="delete-btn" 
                          onClick={() => handleDeleteMember(member.id)}
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-results">
                <p>No members found matching your search.</p>
              </div>
            )}
          </div>
        )}
        
        {/* Edit Member Modal */}
        {editingMember && (
          <div className="edit-modal-overlay">
            <div className="edit-modal">
              <button className="close-modal-btn" onClick={() => setEditingMember(null)}>
                <X size={24} />
              </button>
              
              <h3>Edit Member</h3>
              
              <form onSubmit={handleSaveEdit} className="edit-form">
                <div className="form-group">
                  <label htmlFor="edit-name">Name</label>
                  <input
                    type="text"
                    id="edit-name"
                    name="name"
                    value={editingMember.name}
                    onChange={handleEditChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="edit-position">Position</label>
                  <input
                    type="text"
                    id="edit-position"
                    name="position"
                    value={editingMember.position}
                    onChange={handleEditChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="edit-age">Age</label>
                  <input
                    type="number"
                    id="edit-age"
                    name="age"
                    value={editingMember.age}
                    onChange={handleEditChange}
                    min="18"
                    max="100"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="edit-bio">Bio</label>
                  <textarea
                    id="edit-bio"
                    name="bio"
                    value={editingMember.bio || ''}
                    onChange={handleEditChange}
                    rows={4}
                  />
                </div>
                
                <div className="form-actions">
                  <button type="button" onClick={() => setEditingMember(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="save-btn">
                    <Save size={16} />
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}