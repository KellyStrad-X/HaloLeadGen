'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'general' | 'badges' | 'team';

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [isSaving, setIsSaving] = useState(false);

  // General settings state
  const [companyName, setCompanyName] = useState('');
  const [companyLogo, setCompanyLogo] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Trust badges state
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);

  // Team members state
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  // Inspectors state
  const [inspectors, setInspectors] = useState<string[]>([]);

  // Load existing settings on mount
  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const getAuthToken = async () => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    return await user.getIdToken();
  };

  const loadSettings = async () => {
    try {
      if (!user) return;

      const token = await getAuthToken();
      const response = await fetch('/api/contractor-branding', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data) {
          setCompanyName(data.companyName || '');
          setCompanyLogo(data.companyLogo || '');
          setSelectedBadges(data.trustBadges || []);
          setTeamMembers(data.crewMembers || []);
          setInspectors(data.inspectors || []);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = await getAuthToken();

      // Upload company logo if new file
      let uploadedLogoUrl = companyLogo;
      if (logoFile) {
        const formData = new FormData();
        formData.append('file', logoFile);
        formData.append('type', 'company-logo');

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (uploadResponse.ok) {
          const { imageUrl } = await uploadResponse.json();
          uploadedLogoUrl = imageUrl;
        } else {
          console.error('Logo upload failed');
        }
      }

      // Upload team photos if new files
      const updatedTeamMembers = await Promise.all(
        teamMembers.map(async (member) => {
          if (member.photoFile) {
            const formData = new FormData();
            formData.append('file', member.photoFile);
            formData.append('type', 'team-photo');

            const uploadResponse = await fetch('/api/upload', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
              body: formData,
            });

            if (uploadResponse.ok) {
              const { imageUrl } = await uploadResponse.json();
              return { ...member, photoUrl: imageUrl, photoFile: undefined };
            } else {
              console.error('Team photo upload failed for member:', member.name);
              return member;
            }
          }
          return member;
        })
      );

      // Save branding data
      const response = await fetch('/api/contractor-branding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          companyName: companyName.trim() || undefined,
          companyLogo: uploadedLogoUrl || undefined,
          trustBadges: selectedBadges,
          crewMembers: updatedTeamMembers,
          inspectors: inspectors.filter(i => i.trim()),
        }),
      });

      if (response.ok) {
        alert('Settings saved successfully!');
        onClose();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert(`Error saving settings: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-70 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-[#1e2227] border border-[#373e47] rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#373e47] px-6 py-4 bg-[#2d333b]">
            <div>
              <p className="text-sm uppercase tracking-wide text-gray-400">Dashboard</p>
              <h2 className="text-2xl font-bold text-white">Settings</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-[#373e47] px-6 bg-[#1e2227]">
            <nav className="flex gap-8">
              <button
                onClick={() => setActiveTab('general')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'general'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                General
              </button>
              <button
                onClick={() => setActiveTab('badges')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'badges'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                Trust Badges
              </button>
              <button
                onClick={() => setActiveTab('team')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'team'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                Team
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] bg-[#0d1117] space-y-8">
            {activeTab === 'general' && (
              <GeneralTab
                companyName={companyName}
                setCompanyName={setCompanyName}
                companyLogo={companyLogo}
                setCompanyLogo={setCompanyLogo}
                setLogoFile={setLogoFile}
              />
            )}

            {activeTab === 'badges' && (
              <BadgesTab
                selectedBadges={selectedBadges}
                setSelectedBadges={setSelectedBadges}
              />
            )}

            {activeTab === 'team' && (
              <TeamTab
                teamMembers={teamMembers}
                setTeamMembers={setTeamMembers}
                inspectors={inspectors}
                setInspectors={setInspectors}
              />
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[#373e47] px-6 py-4 bg-[#0d1117] flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-[#444c56] rounded-lg text-gray-300 hover:bg-[#2d333b] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-cyan-500 text-black rounded-lg hover:bg-cyan-600 disabled:bg-[#1e2227] disabled:text-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// General Tab Component
function GeneralTab({ companyName, setCompanyName, companyLogo, setCompanyLogo, setLogoFile }: any) {
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompanyLogo(reader.result as string);
        setLogoFile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setCompanyLogo('');
    setLogoFile(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block font-medium text-white mb-1">
          Company Display Name
        </label>
        <p className="text-sm text-gray-400 mb-4">
          Override the company name shown in headers and QR landing pages. Leave blank to use your registration name.
        </p>

        <input
          type="text"
          placeholder="e.g., ABC Roofing & Construction"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className="w-full bg-[#1e2227] border border-[#545d68] rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
        />

        <p className="text-xs text-gray-500 mt-2">
          This will appear in the top left corner of all your campaign pages and marketing materials.
        </p>
      </div>

      {/* Company Logo Upload */}
      <div>
        <label className="block font-medium text-white mb-1">
          Company Logo
        </label>
        <p className="text-sm text-gray-400 mb-4">
          Upload your company logo. It will appear on team member business cards.
        </p>

        <div className="flex items-center gap-4">
          {companyLogo ? (
            <div className="relative">
              <img
                src={companyLogo}
                alt="Company logo"
                className="w-24 h-24 rounded-full object-cover border-2 border-[#545d68]"
              />
              <button
                onClick={removeLogo}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                type="button"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <label className="w-24 h-24 rounded-full border-2 border-dashed border-[#545d68] flex items-center justify-center cursor-pointer hover:border-cyan-400 bg-[#1e2227]">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <span className="text-2xl">🏢</span>
            </label>
          )}
          <p className="text-xs text-gray-400">
            Recommended: Square image, at least 400x400px
          </p>
        </div>
      </div>

      <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
        <p className="text-sm text-cyan-300">
          <strong>Note:</strong> More general settings will be added here in future updates (e.g., default contact info, timezone, notification preferences).
        </p>
      </div>
    </div>
  );
}

// Badges Tab Component
function BadgesTab({ selectedBadges, setSelectedBadges }: any) {
  const TRUST_BADGES = [
    { id: 'gaf-master-elite', name: 'GAF Master Elite' },
    { id: 'owens-corning', name: 'Owens Corning Preferred' },
    { id: 'certainteed', name: 'CertainTeed SELECT' },
    { id: 'bbb-accredited', name: 'BBB Accredited' },
    { id: 'angi-super-service', name: 'Angi Super Service' },
    { id: 'nrca-member', name: 'NRCA Member' },
    { id: 'licensed-insured', name: 'Licensed & Insured' },
    { id: 'lifetime-warranty', name: 'Lifetime Warranty' },
    { id: 'tamko-pro', name: 'Tamko Pro Certified' },
    { id: 'malarkey', name: 'Malarkey Certified' },
    { id: 'atlas-pro', name: 'Atlas Pro Plus' },
    { id: 'insurance-approved', name: 'Insurance Approved' },
  ];

  const toggleBadge = (badgeId: string) => {
    if (selectedBadges.includes(badgeId)) {
      setSelectedBadges(selectedBadges.filter((id: string) => id !== badgeId));
    } else if (selectedBadges.length < 6) {
      setSelectedBadges([...selectedBadges, badgeId]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block font-medium text-white mb-1">
          Select Your Certifications
        </label>
        <p className="text-sm text-gray-400 mb-4">
          Choose 3-6 badges to display on your QR landing pages
        </p>

        {/* Selected count */}
        <div className="mb-6 text-sm text-gray-300">
          Selected: <strong className="text-cyan-400">{selectedBadges.length}/6</strong>
          {selectedBadges.length < 3 && (
            <span className="ml-2 text-orange-400">(Select at least 3)</span>
          )}
        </div>

        {/* Badge grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {TRUST_BADGES.map((badge) => {
            const isSelected = selectedBadges.includes(badge.id);
            const isDisabled = selectedBadges.length >= 6 && !isSelected;

            return (
              <button
                key={badge.id}
                onClick={() => toggleBadge(badge.id)}
                disabled={isDisabled}
                className={`
                  relative border-2 rounded-lg p-4 transition-all
                  ${isSelected
                    ? 'border-cyan-400 bg-cyan-500/10 ring-2 ring-cyan-400/30'
                    : 'border-[#444c56] hover:border-[#545d68] bg-[#2d333b]'
                  }
                  ${isDisabled
                    ? 'opacity-40 cursor-not-allowed'
                    : 'cursor-pointer'
                  }
                `}
              >
                {/* Badge image placeholder */}
                <div className="h-16 w-full mb-3 bg-[#1e2227] rounded flex items-center justify-center overflow-hidden">
                  <img
                    src={`/trust-badges/${badge.id}.png`}
                    alt={badge.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      // Hide image if it fails to load (no file exists yet)
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>

                <p className="text-xs text-center text-gray-300 font-medium leading-tight">
                  {badge.name}
                </p>

                {/* Checkmark if selected */}
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-cyan-500 rounded-full p-1">
                    <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Helper text */}
      <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
        <p className="text-sm text-cyan-300">
          <strong>Note:</strong> Add badge images as PNG files to <code className="bg-[#2d333b] px-1 rounded">/public/trust-badges/</code> using the badge ID as the filename (e.g., <code className="bg-[#2d333b] px-1 rounded">gaf-master-elite.png</code>). Empty boxes will show until images are added.
        </p>
      </div>
    </div>
  );
}

// Team Tab Component
function TeamTab({ teamMembers, setTeamMembers, inspectors, setInspectors }: any) {
  const [cropData, setCropData] = useState<{memberId: string, imageData: string} | null>(null);
  const [newInspectorName, setNewInspectorName] = useState('');

  const addInspector = () => {
    if (newInspectorName.trim() && !inspectors.includes(newInspectorName.trim())) {
      setInspectors([...inspectors, newInspectorName.trim()]);
      setNewInspectorName('');
    }
  };

  const removeInspector = (index: number) => {
    setInspectors(inspectors.filter((_: any, i: number) => i !== index));
  };

  const addTeamMember = () => {
    if (teamMembers.length >= 2) return;

    const newMember = {
      id: Date.now().toString(),
      name: '',
      title: '',
      phone: '',
      bio: '',
      photoUrl: '',
      photoFile: null,
      yearsExperience: '',
      certifications: [],
    };
    setTeamMembers([...teamMembers, newMember]);
  };

  const removeMember = (id: string) => {
    setTeamMembers(teamMembers.filter((m: any) => m.id !== id));
  };

  const updateMember = (id: string, updates: Partial<any>) => {
    setTeamMembers((prev: any[]) =>
      prev.map((m: any) =>
        m.id === id ? { ...m, ...updates } : m
      )
    );
  };

  const handlePhotoUpload = (memberId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropData({ memberId, imageData: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (memberId: string, croppedImage: Blob) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      updateMember(memberId, {
        photoUrl: reader.result as string,
        photoFile: croppedImage
      });
      setCropData(null);
    };
    reader.readAsDataURL(croppedImage);
  };

  const removeMemberPhoto = (memberId: string) => {
    updateMember(memberId, { photoUrl: '', photoFile: null });
  };

  return (
    <div className="space-y-8">
      {/* Inspectors Section */}
      <div>
        <label className="block font-medium text-white mb-1">Inspectors</label>
        <p className="text-sm text-gray-400 mb-4">
          Manage your team of inspectors for job scheduling
        </p>

        {/* Existing inspectors */}
        <div className="space-y-2 mb-4">
          {inspectors.map((inspector: string, index: number) => (
            <div
              key={index}
              className="flex items-center justify-between border border-[#444c56] rounded-lg p-3 bg-[#2d333b]"
            >
              <span className="text-white">{inspector}</span>
              <button
                onClick={() => removeInspector(index)}
                className="text-red-400 hover:text-red-300 p-1"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          {inspectors.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              No inspectors added yet. Add your first inspector below.
            </p>
          )}
        </div>

        {/* Add inspector */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Inspector name"
            value={newInspectorName}
            onChange={(e) => setNewInspectorName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addInspector()}
            className="flex-1 bg-[#1e2227] border border-[#545d68] rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
          />
          <button
            onClick={addInspector}
            type="button"
            disabled={!newInspectorName.trim()}
            className="px-4 py-2 bg-cyan-500 text-black rounded-lg hover:bg-cyan-600 disabled:bg-[#2d333b] disabled:text-gray-500 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            Add
          </button>
        </div>
      </div>

      {/* Team Members Section */}
      <div>
        <label className="block font-medium text-white mb-1">Team Members</label>
        <p className="text-sm text-gray-400 mb-4">
          Showcase 1-2 key team members on your QR landing pages
        </p>

        {/* Existing team members */}
        <div className="space-y-4 mb-4">
          {teamMembers.map((member: any) => (
            <div
              key={member.id}
              className="border border-[#444c56] rounded-lg p-4 bg-[#2d333b]"
            >
              <div className="flex items-start gap-4">
                {/* Photo */}
                <div className="flex-shrink-0">
                  {member.photoUrl ? (
                    <div className="relative w-20 h-20">
                      <img
                        src={member.photoUrl}
                        alt={member.name || 'Team member'}
                        className="w-full h-full rounded-full object-cover border-2 border-[#545d68]"
                      />
                      <button
                        onClick={() => removeMemberPhoto(member.id)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        type="button"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-20 h-20 rounded-full border-2 border-dashed border-[#545d68] flex items-center justify-center cursor-pointer hover:border-cyan-400 bg-[#1e2227]">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(member.id, e)}
                        className="hidden"
                      />
                      <span className="text-2xl">📷</span>
                    </label>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 space-y-3">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={member.name || ''}
                    onChange={(e) => updateMember(member.id, { name: e.target.value })}
                    className="w-full bg-[#1e2227] border border-[#545d68] rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Title (e.g., Owner)"
                      value={member.title || ''}
                      onChange={(e) => updateMember(member.id, { title: e.target.value })}
                      className="bg-[#1e2227] border border-[#545d68] rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    />
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={member.phone || ''}
                      onChange={(e) => updateMember(member.id, { phone: e.target.value })}
                      className="bg-[#1e2227] border border-[#545d68] rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <textarea
                      placeholder="Bio (optional, 2-3 sentences about expertise and background)"
                      value={member.bio || ''}
                      onChange={(e) => {
                        const text = e.target.value;
                        if (text.length <= 200) {
                          updateMember(member.id, { bio: text });
                        }
                      }}
                      rows={2}
                      maxLength={200}
                      className="w-full bg-[#1e2227] border border-[#545d68] rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-400 focus:border-transparent resize-none text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {member.bio?.length || 0}/200 characters
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={member.yearsExperience || ''}
                      onChange={(e) => updateMember(member.id, { yearsExperience: e.target.value })}
                      className="bg-[#1e2227] border border-[#545d68] rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    >
                      <option value="">Years Experience</option>
                      <option value="1-3">1-3 years</option>
                      <option value="3-5">3-5 years</option>
                      <option value="5-10">5-10 years</option>
                      <option value="10+">10+ years</option>
                      <option value="20+">20+ years</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Certifications (comma-separated)"
                      value={member.certifications?.join(', ') || ''}
                      onChange={(e) =>
                        updateMember(member.id, {
                          certifications: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean)
                        })
                      }
                      className="bg-[#1e2227] border border-[#545d68] rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => removeMember(member.id)}
                  className="text-red-400 hover:text-red-300 p-1"
                  type="button"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add member button */}
        {teamMembers.length < 2 && (
          <button
            onClick={addTeamMember}
            type="button"
            className="w-full border-2 border-dashed border-[#444c56] rounded-lg py-4 text-gray-400 hover:border-cyan-400 hover:text-cyan-400 transition-colors"
          >
            + Add Team Member ({teamMembers.length}/2)
          </button>
        )}

        {teamMembers.length === 0 && (
          <p className="text-sm text-gray-400 text-center mt-4">
            No team members added yet. Click the button above to add your first team member.
          </p>
        )}
      </div>

      {/* Image Cropper Modal */}
      {cropData && (
        <CircularImageCropper
          imageData={cropData.imageData}
          onCropComplete={(blob) => handleCropComplete(cropData.memberId, blob)}
          onCancel={() => setCropData(null)}
        />
      )}
    </div>
  );
}

// Simple Circular Image Cropper Component
function CircularImageCropper({ imageData, onCropComplete, onCancel }: {
  imageData: string;
  onCropComplete: (blob: Blob) => void;
  onCancel: () => void;
}) {
  const [zoom, setZoom] = useState(1);
  const canvasRef = useState<HTMLCanvasElement | null>(null)[0];
  const imgRef = useState<HTMLImageElement | null>(null)[0];

  const handleCrop = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const size = 400; // Output size
      canvas.width = size;
      canvas.height = size;

      // Calculate scaling and positioning for zoom
      const scale = zoom;
      const sourceSize = Math.min(img.width, img.height) / scale;
      const sx = (img.width - sourceSize) / 2;
      const sy = (img.height - sourceSize) / 2;

      // Draw circular clipped image
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      ctx.drawImage(img, sx, sy, sourceSize, sourceSize, 0, 0, size, size);

      canvas.toBlob((blob) => {
        if (blob) {
          onCropComplete(blob);
        }
      }, 'image/png');
    };
    img.src = imageData;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80">
      <div className="bg-[#1e2227] rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold text-white mb-4">Crop Photo</h3>

        {/* Preview */}
        <div className="relative w-64 h-64 mx-auto mb-4 bg-[#2d333b] rounded-full overflow-hidden">
          <img
            src={imageData}
            alt="Preview"
            className="w-full h-full object-cover"
            style={{ transform: `scale(${zoom})` }}
          />
        </div>

        {/* Zoom Slider */}
        <div className="mb-6">
          <label className="block text-sm text-gray-300 mb-2">Zoom</label>
          <input
            type="range"
            min="1"
            max="3"
            step="0.1"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-[#444c56] rounded-lg text-gray-300 hover:bg-[#2d333b] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCrop}
            className="flex-1 px-4 py-2 bg-cyan-500 text-black rounded-lg hover:bg-cyan-600 transition-colors font-semibold"
          >
            Crop & Save
          </button>
        </div>
      </div>
    </div>
  );
}
