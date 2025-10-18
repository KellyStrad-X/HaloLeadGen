'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface BrandingSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'company' | 'badges' | 'team';

export default function BrandingSettingsModal({ isOpen, onClose }: BrandingSettingsModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('company');
  const [isSaving, setIsSaving] = useState(false);

  // Company branding state
  const [logoUrl, setLogoUrl] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [tagline, setTagline] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [secondaryColor, setSecondaryColor] = useState('#10b981');

  // Trust badges state
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);

  // Team members state
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  // Load existing branding on mount
  useEffect(() => {
    if (isOpen) {
      loadBranding();
    }
  }, [isOpen]);

  const getAuthToken = async () => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    return await user.getIdToken();
  };

  const loadBranding = async () => {
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
          setLogoUrl(data.companyLogo || '');
          setTagline(data.tagline || '');
          setPrimaryColor(data.primaryColor || '#2563eb');
          setSecondaryColor(data.secondaryColor || '#10b981');
          setSelectedBadges(data.trustBadges || []);
          setTeamMembers(data.crewMembers || []);
        }
      }
    } catch (error) {
      console.error('Error loading branding:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = await getAuthToken();

      // Upload logo if new file selected
      let finalLogoUrl = logoUrl;
      if (logoFile) {
        const formData = new FormData();
        formData.append('file', logoFile);
        formData.append('type', 'logo');

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (uploadResponse.ok) {
          const { imageUrl } = await uploadResponse.json();
          finalLogoUrl = imageUrl;
        } else {
          throw new Error('Logo upload failed');
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
          companyLogo: finalLogoUrl,
          tagline,
          primaryColor,
          secondaryColor,
          trustBadges: selectedBadges,
          crewMembers: updatedTeamMembers,
        }),
      });

      if (response.ok) {
        alert('Branding settings saved successfully!');
        onClose();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Error saving branding:', error);
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
          className="relative bg-slate-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
            <h2 className="text-2xl font-bold text-white">Settings</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-slate-700 px-6">
            <nav className="flex gap-8">
              <button
                onClick={() => setActiveTab('company')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'company'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                Company
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
                Meet the Team
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {activeTab === 'company' && (
              <CompanyTab
                logoUrl={logoUrl}
                logoFile={logoFile}
                setLogoFile={setLogoFile}
                setLogoUrl={setLogoUrl}
                tagline={tagline}
                setTagline={setTagline}
                primaryColor={primaryColor}
                setPrimaryColor={setPrimaryColor}
                secondaryColor={secondaryColor}
                setSecondaryColor={setSecondaryColor}
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
              />
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-700 px-6 py-4 bg-slate-900 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-600 rounded-lg text-gray-300 hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-cyan-500 text-black rounded-lg hover:bg-cyan-600 disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Company Tab Component
function CompanyTab({
  logoUrl,
  logoFile,
  setLogoFile,
  setLogoUrl,
  tagline,
  setTagline,
  primaryColor,
  setPrimaryColor,
  secondaryColor,
  setSecondaryColor,
}: any) {
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoUrl('');
    setLogoFile(null);
  };

  return (
    <div className="space-y-8">
      {/* Logo Upload */}
      <div>
        <label className="block font-medium text-white mb-1">Company Logo</label>
        <p className="text-sm text-gray-400 mb-3">
          Appears on your QR landing pages (recommended: 400x100px, max 2MB)
        </p>

        {logoUrl ? (
          <div className="relative inline-block">
            <div className="w-64 h-32 border border-slate-600 rounded-lg p-4 bg-slate-700">
              <img
                src={logoUrl}
                alt="Logo preview"
                className="w-full h-full object-contain"
              />
            </div>
            <button
              onClick={removeLogo}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label className="border-2 border-dashed border-slate-600 rounded-lg p-8 cursor-pointer hover:border-cyan-400 transition-colors block w-64 text-center bg-slate-700">
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <div className="text-gray-400">
              <div className="mb-2 text-4xl">📤</div>
              <span className="text-sm">Click to upload logo</span>
            </div>
          </label>
        )}
      </div>

      {/* Tagline */}
      <div>
        <label className="block font-medium text-white mb-1">
          Company Tagline <span className="text-gray-400 font-normal">(Optional)</span>
        </label>
        <p className="text-sm text-gray-400 mb-3">
          Shown below your company name on QR pages
        </p>
        <input
          type="text"
          maxLength={100}
          placeholder="e.g., Your trusted roofing experts since 1995"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">{tagline.length}/100</p>
      </div>

      {/* Brand Colors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Primary Color */}
        <div>
          <label className="block font-medium text-white mb-1">Primary Color</label>
          <p className="text-sm text-gray-400 mb-3">
            Used for headlines, buttons, and links
          </p>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-14 h-14 rounded-lg border border-slate-600 cursor-pointer bg-slate-700"
            />
            <input
              type="text"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              placeholder="#2563eb"
              className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white font-mono text-sm focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
            />
          </div>
        </div>

        {/* Secondary Color */}
        <div>
          <label className="block font-medium text-white mb-1">
            Secondary Color <span className="text-gray-400 font-normal">(Optional)</span>
          </label>
          <p className="text-sm text-gray-400 mb-3">
            Used for accents and highlights
          </p>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              className="w-14 h-14 rounded-lg border border-slate-600 cursor-pointer bg-slate-700"
            />
            <input
              type="text"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              placeholder="#10b981"
              className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white font-mono text-sm focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Live Preview */}
      <div className="border border-slate-600 rounded-lg p-6 bg-slate-900">
        <p className="text-sm text-gray-400 mb-4 font-medium">Preview:</p>
        <div className="space-y-4">
          <h3
            className="text-3xl font-bold"
            style={{ color: primaryColor }}
          >
            Free Roof Inspections
          </h3>
          <button
            className="px-6 py-3 rounded-lg text-white font-medium"
            style={{ backgroundColor: primaryColor }}
          >
            Request Inspection
          </button>
        </div>
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
                    : 'border-slate-600 hover:border-slate-500 bg-slate-700'
                  }
                  ${isDisabled
                    ? 'opacity-40 cursor-not-allowed'
                    : 'cursor-pointer'
                  }
                `}
              >
                {/* Placeholder badge image */}
                <div className="h-16 w-full mb-3 bg-slate-600 rounded flex items-center justify-center">
                  <span className="text-2xl">🏆</span>
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
          <strong>Note:</strong> Badge images are placeholders (🏆). You can replace them later with actual badge images in <code className="bg-slate-700 px-1 rounded">/public/trust-badges/</code>
        </p>
      </div>
    </div>
  );
}

// Team Tab Component
function TeamTab({ teamMembers, setTeamMembers }: any) {
  const addTeamMember = () => {
    if (teamMembers.length >= 2) return;

    const newMember = {
      id: Date.now().toString(),
      name: '',
      title: '',
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

  const updateMember = (id: string, field: string, value: any) => {
    setTeamMembers(
      teamMembers.map((m: any) =>
        m.id === id ? { ...m, [field]: value } : m
      )
    );
  };

  const handlePhotoUpload = (memberId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateMember(memberId, 'photoUrl', reader.result as string);
        updateMember(memberId, 'photoFile', file);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeMemberPhoto = (memberId: string) => {
    updateMember(memberId, 'photoUrl', '');
    updateMember(memberId, 'photoFile', null);
  };

  return (
    <div className="space-y-6">
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
              className="border border-slate-600 rounded-lg p-4 bg-slate-700"
            >
              <div className="flex items-start gap-4">
                {/* Photo */}
                <div className="flex-shrink-0">
                  {member.photoUrl ? (
                    <div className="relative w-20 h-20">
                      <img
                        src={member.photoUrl}
                        alt={member.name || 'Team member'}
                        className="w-full h-full rounded-full object-cover border-2 border-slate-500"
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
                    <label className="w-20 h-20 rounded-full border-2 border-dashed border-slate-500 flex items-center justify-center cursor-pointer hover:border-cyan-400 bg-slate-600">
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
                    value={member.name}
                    onChange={(e) => updateMember(member.id, 'name', e.target.value)}
                    className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Title (e.g., Owner, Lead Installer)"
                    value={member.title}
                    onChange={(e) => updateMember(member.id, 'title', e.target.value)}
                    className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Years Experience"
                      value={member.yearsExperience}
                      onChange={(e) => updateMember(member.id, 'yearsExperience', e.target.value)}
                      className="bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Certifications (comma-separated)"
                      value={member.certifications?.join(', ') || ''}
                      onChange={(e) =>
                        updateMember(
                          member.id,
                          'certifications',
                          e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean)
                        )
                      }
                      className="bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
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
            className="w-full border-2 border-dashed border-slate-600 rounded-lg py-4 text-gray-400 hover:border-cyan-400 hover:text-cyan-400 transition-colors"
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
    </div>
  );
}
