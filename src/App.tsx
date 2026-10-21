/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Procedure,
  AppViewMode,
  FontSizeLevel,
  PortalTab,
  NewsArticle,
  WorkScheduleItem,
  CitizenFeedback,
  TransparencyItem,
  TrafficFloodReport,
  AdministrativeContact,
  PartyGovLeader,
  DailyStatRecord
} from './types';
import { systemStorage, SystemDatabaseState, getInitialSystemDefaults } from './services/systemStorage';
import { DEFAULT_DAILY_STATS } from './data/dailyStatsData';
import { Header } from './components/Header';
import { SidebarNav } from './components/SidebarNav';
import { PublicView } from './components/PublicView';
import { AdminCMS } from './components/AdminCMS';
import { NewsSection } from './components/portal/NewsSection';
import { ScheduleSection } from './components/portal/ScheduleSection';
import { PartyGovSection } from './components/portal/PartyGovSection';
import { ProceduresRepositorySection } from './components/portal/ProceduresRepositorySection';
import { TransparencySection } from './components/portal/TransparencySection';
import { FeedbackSection } from './components/portal/FeedbackSection';
import { ContactsSection } from './components/portal/ContactsSection';
import { TrafficFloodSection } from './components/portal/TrafficFloodSection';
import { AdminLoginModal } from './components/AdminLoginModal';
import { CompanionChatbot } from './components/CompanionChatbot';
import { ShieldCheck, MapPin, Building2, Phone, Landmark } from 'lucide-react';
import { ttsManager } from './utils/speechSynthesis';
import { voiceService } from './utils/speechRecognition';

export default function App() {
  const initialData = (typeof systemStorage !== 'undefined' && systemStorage?.getState) 
    ? systemStorage.getState() 
    : getInitialSystemDefaults();

  const [procedures, setProcedures] = useState<Procedure[]>(() => initialData?.procedures || []);
  const [viewMode, setViewMode] = useState<AppViewMode>('public');
  const [portalTab, setPortalTab] = useState<PortalTab>('home');
  const [fontSize, setFontSize] = useState<FontSizeLevel>('normal');

  // Dynamic portal data
  const [news, setNews] = useState<NewsArticle[]>(() => initialData?.news || []);
  const [schedules, setSchedules] = useState<WorkScheduleItem[]>(() => initialData?.schedules || []);
  const [feedbacks, setFeedbacks] = useState<CitizenFeedback[]>(() => initialData?.feedbacks || []);
  const [transparencyDocs, setTransparencyDocs] = useState<TransparencyItem[]>(() => initialData?.transparencyDocs || []);
  const [trafficReports, setTrafficReports] = useState<TrafficFloodReport[]>(() => initialData?.trafficReports || []);
  const [contacts, setContacts] = useState<AdministrativeContact[]>(() => initialData?.contacts || []);
  const [partyGovLeaders, setPartyGovLeaders] = useState<PartyGovLeader[]>(() => initialData?.partyGovLeaders || []);
  const [dailyStats, setDailyStats] = useState<DailyStatRecord[]>(() => initialData?.dailyStats || DEFAULT_DAILY_STATS);

  // Admin authentication state: secure access to Phân hệ Cán bộ with fail-safe try/catch
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return typeof window !== 'undefined' && window.localStorage && localStorage.getItem('tanmy_admin_authenticated') === 'true';
    } catch {
      return false;
    }
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Link from Procedures Repository to Voice Guidance in Home tab
  const [selectedProcedureForGuidance, setSelectedProcedureForGuidance] = useState<Procedure | null>(null);

  // Subscribe to permanent system storage updates (synced with server disk, BroadcastChannel, and other devices)
  useEffect(() => {
    const unsubscribe = systemStorage.subscribe((state: SystemDatabaseState) => {
      setProcedures(state.procedures);
      setNews(state.news);
      setSchedules(state.schedules);
      setFeedbacks(state.feedbacks);
      setTransparencyDocs(state.transparencyDocs);
      setTrafficReports(state.trafficReports);
      setContacts(state.contacts);
      setPartyGovLeaders(state.partyGovLeaders);
      if (state.dailyStats && state.dailyStats.length > 0) {
        setDailyStats(state.dailyStats);
      }
    });
    return () => unsubscribe();
  }, []);

  // Mode change handler with authentication gate
  const handleViewModeChange = (mode: AppViewMode) => {
    if (mode === 'admin') {
      if (!isAdminAuthenticated) {
        setIsLoginModalOpen(true);
        return;
      }
      setViewMode('admin');
    } else {
      setViewMode('public');
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    setIsLoginModalOpen(false);
    setViewMode('admin');
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('tanmy_admin_authenticated');
    setIsAdminAuthenticated(false);
    setViewMode('public');
  };

  // Procedure CRUD operations (Admin CMS)
  const handleAddProcedure = (newProc: Procedure) => {
    const updated = [newProc, ...procedures];
    setProcedures(updated);
    systemStorage.updateCollections({ procedures: updated });
  };

  const handleUpdateProcedure = (updatedProc: Procedure) => {
    const updated = procedures.map(p => (p.id === updatedProc.id ? updatedProc : p));
    setProcedures(updated);
    systemStorage.updateCollections({ procedures: updated });
  };

  const handleDeleteProcedure = (id: string) => {
    const updated = procedures.filter(p => p.id !== id);
    setProcedures(updated);
    systemStorage.updateCollections({ procedures: updated });
  };

  const handleResetDefault = () => {
    systemStorage.resetToDefaults();
  };

  const handleImportProcedures = (imported: Procedure[]) => {
    setProcedures(imported);
    systemStorage.updateCollections({ procedures: imported });
  };

  const handlePreviewInPublic = (proc: Procedure) => {
    setSelectedProcedureForGuidance(proc);
    setPortalTab('home');
    setViewMode('public');
  };

  const handleUpdateProcedureVideo = (procedureId: string, videoDataUrl: string, fileName: string) => {
    const updated = procedures.map(p => (p.id === procedureId ? { ...p, videoDataUrl, videoFileName: fileName } : p));
    setProcedures(updated);
    systemStorage.updateCollections({ procedures: updated });
  };

  // Portal News Handlers
  const handleAddNews = (article: NewsArticle) => {
    const updated = [article, ...news];
    setNews(updated);
    systemStorage.updateCollections({ news: updated });
  };

  const handleUpdateNews = (article: NewsArticle) => {
    const updated = news.map(n => n.id === article.id ? article : n);
    setNews(updated);
    systemStorage.updateCollections({ news: updated });
  };

  const handleDeleteNews = (id: string) => {
    const updated = news.filter(n => n.id !== id);
    setNews(updated);
    systemStorage.updateCollections({ news: updated });
  };

  // Portal Schedule Handlers
  const handleAddSchedule = (item: WorkScheduleItem) => {
    const updated = [item, ...schedules];
    setSchedules(updated);
    systemStorage.updateCollections({ schedules: updated });
  };

  const handleUpdateSchedule = (item: WorkScheduleItem) => {
    const updated = schedules.map(s => s.id === item.id ? item : s);
    setSchedules(updated);
    systemStorage.updateCollections({ schedules: updated });
  };

  const handleDeleteSchedule = (id: string) => {
    const updated = schedules.filter(s => s.id !== id);
    setSchedules(updated);
    systemStorage.updateCollections({ schedules: updated });
  };

  // Portal Feedback Handlers (Citizens can submit, Officers can respond)
  const handleAddFeedback = (feedback: CitizenFeedback) => {
    const updated = [feedback, ...feedbacks];
    setFeedbacks(updated);
    systemStorage.updateCollections({ feedbacks: updated });
  };

  const handleUpdateFeedback = (updatedFeedback: CitizenFeedback) => {
    const updated = feedbacks.map(f => f.id === updatedFeedback.id ? updatedFeedback : f);
    setFeedbacks(updated);
    systemStorage.updateCollections({ feedbacks: updated });
  };

  const handleDeleteFeedback = (id: string) => {
    const updated = feedbacks.filter(f => f.id !== id);
    setFeedbacks(updated);
    systemStorage.updateCollections({ feedbacks: updated });
  };

  // Transparency Handlers
  const handleAddTransparencyDoc = (doc: TransparencyItem) => {
    const updated = [doc, ...transparencyDocs];
    setTransparencyDocs(updated);
    systemStorage.updateCollections({ transparencyDocs: updated });
  };

  const handleUpdateTransparencyDoc = (doc: TransparencyItem) => {
    const updated = transparencyDocs.map(d => d.id === doc.id ? doc : d);
    setTransparencyDocs(updated);
    systemStorage.updateCollections({ transparencyDocs: updated });
  };

  const handleDeleteTransparencyDoc = (id: string) => {
    const updated = transparencyDocs.filter(d => d.id !== id);
    setTransparencyDocs(updated);
    systemStorage.updateCollections({ transparencyDocs: updated });
  };

  // Traffic & Flood Handlers (Citizen report & Officer alerts)
  const handleAddTrafficReport = (report: TrafficFloodReport) => {
    const updated = [report, ...trafficReports];
    setTrafficReports(updated);
    systemStorage.updateCollections({ trafficReports: updated });
  };

  const handleUpdateTrafficReport = (report: TrafficFloodReport) => {
    const updated = trafficReports.map(r => r.id === report.id ? report : r);
    setTrafficReports(updated);
    systemStorage.updateCollections({ trafficReports: updated });
  };

  const handleDeleteTrafficReport = (id: string) => {
    const updated = trafficReports.filter(r => r.id !== id);
    setTrafficReports(updated);
    systemStorage.updateCollections({ trafficReports: updated });
  };

  // Contacts Handlers
  const handleAddContact = (contact: AdministrativeContact) => {
    const updated = [contact, ...contacts];
    setContacts(updated);
    systemStorage.updateCollections({ contacts: updated });
  };

  const handleUpdateContact = (contact: AdministrativeContact) => {
    const updated = contacts.map(c => c.id === contact.id ? contact : c);
    setContacts(updated);
    systemStorage.updateCollections({ contacts: updated });
  };

  const handleDeleteContact = (id: string) => {
    const updated = contacts.filter(c => c.id !== id);
    setContacts(updated);
    systemStorage.updateCollections({ contacts: updated });
  };

  // Party & Gov Leader Handlers
  const handleAddPartyGovLeader = (leader: PartyGovLeader) => {
    const updated = [leader, ...partyGovLeaders];
    setPartyGovLeaders(updated);
    systemStorage.updateCollections({ partyGovLeaders: updated });
  };

  const handleUpdatePartyGovLeader = (leader: PartyGovLeader) => {
    const updated = partyGovLeaders.map(l => l.id === leader.id ? leader : l);
    setPartyGovLeaders(updated);
    systemStorage.updateCollections({ partyGovLeaders: updated });
  };

  const handleDeletePartyGovLeader = (id: string) => {
    const updated = partyGovLeaders.filter(l => l.id !== id);
    setPartyGovLeaders(updated);
    systemStorage.updateCollections({ partyGovLeaders: updated });
  };

  const handleUpdateDailyStats = (records: DailyStatRecord[]) => {
    setDailyStats(records);
    systemStorage.updateCollections({ dailyStats: records });
  };

  const handleTabChange = (tab: PortalTab) => {
    if (tab !== 'home') {
      // Stop speech when navigating away from home voice assistant
      ttsManager.stop();
      voiceService.stop();
    }
    setPortalTab(tab);
  };

  const handleSelectProcedureFromRepo = (proc: Procedure) => {
    setSelectedProcedureForGuidance(proc);
    setPortalTab('home');
  };

  return (
    <div className={`min-h-screen w-full overflow-x-hidden bg-slate-100/70 text-slate-800 flex flex-col justify-between font-size-${fontSize}`}>
      {/* Official Government App Header */}
      <Header
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        proceduresCount={procedures.length}
        isAdminAuthenticated={isAdminAuthenticated}
        onAdminLogout={handleAdminLogout}
      />

      {/* Main Content Area - Formatted to cleanly fit inside any device screen (Phone, Laptop, Large Screen / TV Kiosk) */}
      <main className="flex-1 max-w-7xl 2xl:max-w-[1600px] 3xl:max-w-[1900px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5">
        {viewMode === 'public' ? (
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 2xl:gap-8 items-start">
            {/* Left Sidebar with Vertical Tabs */}
            <SidebarNav
              activeTab={portalTab}
              onTabChange={handleTabChange}
              unreadFeedbacksCount={feedbacks.length}
              newsCount={news.length}
              trafficFloodCount={trafficReports.length}
            />

            {/* Main Center Stage for the Active Tab */}
            <div className="flex-1 w-full min-w-0">
              {portalTab === 'home' && (
                <PublicView
                  procedures={procedures}
                  onUpdateProcedureVideo={handleUpdateProcedureVideo}
                  initialSelectedProcedure={selectedProcedureForGuidance}
                />
              )}

              {portalTab === 'news' && (
                <NewsSection news={news} />
              )}

              {portalTab === 'schedule' && (
                <ScheduleSection schedules={schedules} />
              )}

              {portalTab === 'party_gov' && (
                <PartyGovSection leaders={partyGovLeaders} />
              )}

              {portalTab === 'procedures' && (
                <ProceduresRepositorySection
                  procedures={procedures}
                  onSelectProcedure={handleSelectProcedureFromRepo}
                />
              )}

              {portalTab === 'transparency' && (
                <TransparencySection items={transparencyDocs} />
              )}

              {portalTab === 'traffic_flood' && (
                <TrafficFloodSection
                  reports={trafficReports}
                  onAddReport={handleAddTrafficReport}
                  onUpdateReport={handleUpdateTrafficReport}
                  onDeleteReport={handleDeleteTrafficReport}
                />
              )}

              {portalTab === 'feedback' && (
                <FeedbackSection
                  feedbacks={feedbacks}
                  onAddFeedback={handleAddFeedback}
                />
              )}

              {portalTab === 'contacts' && (
                <ContactsSection contacts={contacts} />
              )}
            </div>
          </div>
        ) : (
          <AdminCMS
            procedures={procedures}
            onAddProcedure={handleAddProcedure}
            onUpdateProcedure={handleUpdateProcedure}
            onDeleteProcedure={handleDeleteProcedure}
            onResetDefault={handleResetDefault}
            onImportProcedures={handleImportProcedures}
            onPreviewInPublic={handlePreviewInPublic}
            onUpdateProcedureVideo={handleUpdateProcedureVideo}
            news={news}
            onAddNews={handleAddNews}
            onUpdateNews={handleUpdateNews}
            onDeleteNews={handleDeleteNews}
            schedules={schedules}
            onAddSchedule={handleAddSchedule}
            onUpdateSchedule={handleUpdateSchedule}
            onDeleteSchedule={handleDeleteSchedule}
            feedbacks={feedbacks}
            onUpdateFeedback={handleUpdateFeedback}
            onDeleteFeedback={handleDeleteFeedback}
            transparencyDocs={transparencyDocs}
            onAddTransparencyDoc={handleAddTransparencyDoc}
            onUpdateTransparencyDoc={handleUpdateTransparencyDoc}
            onDeleteTransparencyDoc={handleDeleteTransparencyDoc}
            trafficReports={trafficReports}
            onAddTrafficReport={handleAddTrafficReport}
            onUpdateTrafficReport={handleUpdateTrafficReport}
            onDeleteTrafficReport={handleDeleteTrafficReport}
            contacts={contacts}
            onAddContact={handleAddContact}
            onUpdateContact={handleUpdateContact}
            onDeleteContact={handleDeleteContact}
            partyGovLeaders={partyGovLeaders}
            onAddPartyGovLeader={handleAddPartyGovLeader}
            onUpdatePartyGovLeader={handleUpdatePartyGovLeader}
            onDeletePartyGovLeader={handleDeletePartyGovLeader}
            dailyStats={dailyStats}
            onUpdateDailyStats={handleUpdateDailyStats}
          />
        )}
      </main>

      {/* Admin Login Modal for protecting officer CMS */}
      {isLoginModalOpen && (
        <AdminLoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onSuccess={handleAdminLoginSuccess}
        />
      )}

      {/* 
        AI CHATBOT COMPANION (Góc dưới cùng bên phải)
        Người bạn đồng hành giải đáp thủ tục và tư vấn cuộc sống, y tế khoa học
      */}
      {viewMode === 'public' && (
        <CompanionChatbot procedures={procedures} />
      )}

      {/* Official Administrative Ward Footer - Thiết kế trang trọng, gọn gàng, đã xóa logo TM bên dưới cùng theo yêu cầu */}
      <footer className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-300 text-xs border-t-2 border-blue-600/50 py-4 sm:py-5 px-3 sm:px-6 lg:px-8 mt-6 sm:mt-8 shadow-xl">
        <div className="max-w-7xl 2xl:max-w-[1600px] 3xl:max-w-[1900px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center md:text-left">
            <div className="w-10 h-10 rounded-xl bg-blue-900/60 border border-blue-500/40 text-amber-400 flex items-center justify-center flex-shrink-0 shadow-inner">
              <Landmark className="w-5 h-5 text-amber-400" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-xs sm:text-sm font-black text-white tracking-wide uppercase">
                ỦY BAN NHÂN DÂN PHƯỜNG TÂN MỸ - THÀNH PHỐ HỒ CHÍ MINH
              </h3>
              <p className="text-[11px] sm:text-xs text-blue-200/90 font-medium flex items-center justify-center md:justify-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>Số 7, đường Tân Phú, Phường Tân Mỹ, TP. Hồ Chí Minh</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-2.5">
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-300 text-[11px] sm:text-xs font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Hệ Thống Trợ Lý Số Phục Vụ Nhân Dân</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
