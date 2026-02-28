import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, MapPin } from 'lucide-react';
import Nav from '../../components/Nav';
import { useLanguage } from '../../contexts/LanguageContext';
import { useResidentDirectory, useInvalidateResidentData } from '../../hooks/useResidentData';
import '../../styles/resident/members.css';

const MembersResident = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [search, setSearch] = useState('');
  const [filterOnline, setFilterOnline] = useState(false);

  // TanStack Query: resident directory
  const { data: cachedResidents = [], isLoading: queryLoading, error: queryError } = useResidentDirectory();
  const { invalidateDirectory } = useInvalidateResidentData();

  // Filter out current user from the cached list
  const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
  const residents = cachedResidents.filter(r => r.user_id !== userProfile.id);

  // Client-side filtering
  let filteredResidents = residents;
  if (search) {
    filteredResidents = filteredResidents.filter(
      (resident) =>
        resident.first_name?.toLowerCase().includes(search.toLowerCase()) ||
        resident.last_name?.toLowerCase().includes(search.toLowerCase()) ||
        resident.unit_number?.toLowerCase().includes(search.toLowerCase()) ||
        resident.bio?.toLowerCase().includes(search.toLowerCase())
    );
  }
  if (filterOnline) {
    filteredResidents = filteredResidents.filter((resident) => resident.is_online);
  }

  const loading = queryLoading && residents.length === 0;
  const error = queryError?.message || null;

  const handleContact = (resident, method) => {
    console.log('🖱️ handleContact called - method:', method, 'resident:', resident.first_name, resident.last_name);

    if (method === 'email' && resident.email) {
      window.location.href = `mailto:${resident.email}`;
    } else if (method === 'phone' && resident.phone) {
      window.location.href = `tel:${resident.phone}`;
    } else if (method === 'message') {
      console.log('💬 Initiating DM with:', resident);
      console.log('🔍 Resident user_id:', resident.user_id);

      // Prepare recipient data
      const recipientData = {
        user_id: resident.user_id,
        first_name: resident.first_name,
        last_name: resident.last_name,
        unit_number: resident.unit_number
      };

      console.log('📦 Recipient data:', recipientData);

      // Store in localStorage AND pass via navigation state
      localStorage.setItem('dmRecipient', JSON.stringify(recipientData));
      console.log('✅ Stored in localStorage');

      // Verify it was stored
      const stored = localStorage.getItem('dmRecipient');
      console.log('✅ Verified stored data:', stored);

      // Navigate with state as backup
      navigate('/messages/resident?tab=dm&recipient=' + resident.user_id, {
        state: { recipient: recipientData }
      });
      console.log('🔗 Navigated to Messages with recipient:', resident.user_id);
    } else {
      console.warn('⚠️ Message method - conditions not met');
    }
  };

  return (
    <>
    <div className='resident-members-container-fullscreen'>
      <Nav />
      <div className="resident-members-container">
        <div className="members-header">
          <h1>{t('membersResident.title')}</h1>
          <p>{t('membersResident.subtitle')}</p>
        </div>

        {/* Search and Filter */}
        <div className="members-filters">
          <div className="search-box">
            <input
              type="text"
              placeholder={t('membersResident.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            {search && (
              <button
                className="search-clear-btn"
                onClick={() => setSearch('')}
                aria-label={t('membersResident.clearSearch')}
              >
                ✕
              </button>
            )}
          </div>

          <div className="filter-options">
            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={filterOnline}
                onChange={(e) => setFilterOnline(e.target.checked)}
              />
              <span>{t('membersResident.showOnlineOnly')}</span>
            </label>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>{t('membersResident.loadingMembers')}</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="error-container">
            <p className="error-message">{error}</p>
            <button className="retry-btn" onClick={() => invalidateDirectory()}>
              {t('membersResident.tryAgain')}
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredResidents.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <h3>{t('membersResident.noMembersFound')}</h3>
            <p>
              {search || filterOnline
                ? t('membersResident.adjustSearchOrFilters')
                : t('membersResident.noResidentsInBuilding')}
            </p>
            {(search || filterOnline) && (
              <button
                className="reset-filter-btn"
                onClick={() => {
                  setSearch('');
                  setFilterOnline(false);
                }}
              >
                {t('membersResident.clearFilters')}
              </button>
            )}
          </div>
        )}

        {/* Members List */}
        {!loading && !error && filteredResidents.length > 0 && (
          <div className="members-list">
            {console.log(`📋 Rendering ${filteredResidents.length} resident card(s)`)}
            {filteredResidents.map((resident) => {
              console.log(`  - Rendering card for: ${resident.first_name} ${resident.last_name} (ID: ${resident.user_id})`);
              console.log(`    Message button will show: ${resident.contact_via_message && resident.allow_messages}`);
              return (
              <div key={resident.user_id} className="member-card">
                {/* Profile Picture */}
                <div className="member-avatar-container">
                  {resident.profile_picture ? (
                    <img
                      src={resident.profile_picture}
                      alt={`${resident.first_name} ${resident.last_name}`}
                      className="member-avatar"
                    />
                  ) : (
                    <div className="member-avatar-placeholder">
                      {resident.first_name?.[0]}{resident.last_name?.[0]}
                    </div>
                  )}
                  {resident.show_online_status && resident.is_online && (
                    <span className="online-indicator"></span>
                  )}
                </div>

                {/* Member Info */}
                <div className="member-info-container">
                  <div className='member-info'>
                    <h3 className="member-name">
                      {resident.first_name} {resident.last_name}
                      {resident.is_owner && (
                        <span className="owner-badge">{t('membersResident.owner')}</span>
                      )}
                    </h3>

                    {resident.show_unit && resident.unit_number && !resident.is_owner && (
                      <div className="member-detail">
                        <MapPin size={16} />
                        <span>{t('membersResident.unit')} {resident.unit_number}</span>
                        {resident.floor && <span className="member-floor">{t('membersResident.floor')} {resident.floor}</span>}
                      </div>
                    )}
                    {resident.is_owner && (
                      <div className="member-detail owner-detail">
                        <span>{t('membersResident.propertyManager')}</span>
                      </div>
                    )}

                    

                    {resident.show_move_in_date && resident.move_in_date && (
                      <p className="member-move-in">
                        {t('membersResident.movedIn')} {new Date(resident.move_in_date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}
                      </p>
                    )}
                  </div>

                  {/* Contact Options */}
                  <div className="member-contact-options">
                    

                    {/* Show DM button for all members including property manager */}
                    {resident.contact_via_message && resident.allow_messages && (
                      <button
                        className="contact-btn"
                        onClick={() => {
                          console.log(`💬 Message button clicked for ${resident.first_name} ${resident.last_name}`);
                          handleContact(resident, 'message');
                        }}
                        title={t('membersResident.sendMessage')}
                      >
                        <MessageSquare size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}

        {/* Results Count */}
        {!loading && !error && filteredResidents.length > 0 && (
          <div className="members-count">
            {t('membersResident.showingMembers', { shown: filteredResidents.length, total: residents.length })}
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default MembersResident;