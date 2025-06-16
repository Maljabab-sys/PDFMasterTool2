import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

const translations = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    newCase: 'New Case',
    patients: 'Patients',
    aiTest: 'AI Test',
    settings: 'Settings',
    profile: 'Profile',
    logout: 'Logout',
    
    // Dashboard
    welcomeBack: 'Welcome back',
    practiceToday: "Here's what's happening with your dental practice today.",
    totalPatients: 'Total Patients',
    totalCases: 'Total Cases',
    thisMonth: 'This Month',
    activePatients: 'Active Patients',
    casesByVisitType: 'Cases by Visit Type',
    clinicDistribution: 'Clinic Distribution',
    recentCases: 'Recent Cases',
    createNewCase: 'Create a new patient case',
    
    // Cases
    patient: 'Patient',
    action: 'Action',
    date: 'Date',
    status: 'Status',
    actions: 'Actions',
    newCaseCreated: 'New Case Created',
    completed: 'Completed',
    
    // Auth
    login: 'Login',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    name: 'Name',
    confirmPassword: 'Confirm Password',
    
    // Visit Types
    consultation: 'Consultation',
    cleaning: 'Cleaning',
    treatment: 'Treatment',
    emergency: 'Emergency',
    
    // Clinic Types
    mainClinic: 'Main Clinic',
    branchA: 'Branch A',
    branchB: 'Branch B'
  },
  ar: {
    // Navigation
    dashboard: 'لوحة التحكم',
    newCase: 'حالة جديدة',
    patients: 'المرضى',
    aiTest: 'اختبار الذكاء الاصطناعي',
    settings: 'الإعدادات',
    profile: 'الملف الشخصي',
    logout: 'تسجيل الخروج',
    
    // Dashboard
    welcomeBack: 'مرحباً بعودتك',
    practiceToday: 'إليك ما يحدث في عيادة الأسنان اليوم.',
    totalPatients: 'إجمالي المرضى',
    totalCases: 'إجمالي الحالات',
    thisMonth: 'هذا الشهر',
    activePatients: 'المرضى النشطون',
    casesByVisitType: 'الحالات حسب نوع الزيارة',
    clinicDistribution: 'توزيع العيادات',
    recentCases: 'الحالات الأخيرة',
    createNewCase: 'إنشاء حالة مريض جديدة',
    
    // Cases
    patient: 'المريض',
    action: 'الإجراء',
    date: 'التاريخ',
    status: 'الحالة',
    actions: 'الإجراءات',
    newCaseCreated: 'تم إنشاء حالة جديدة',
    completed: 'مكتمل',
    
    // Auth
    login: 'تسجيل الدخول',
    register: 'إنشاء حساب',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    name: 'الاسم',
    confirmPassword: 'تأكيد كلمة المرور',
    
    // Visit Types
    consultation: 'استشارة',
    cleaning: 'تنظيف',
    treatment: 'علاج',
    emergency: 'طوارئ',
    
    // Clinic Types
    mainClinic: 'العيادة الرئيسية',
    branchA: 'الفرع أ',
    branchB: 'الفرع ب'
  },
  fr: {
    // Navigation
    dashboard: 'Tableau de bord',
    newCase: 'Nouveau cas',
    patients: 'Patients',
    aiTest: 'Test IA',
    settings: 'Paramètres',
    profile: 'Profil',
    logout: 'Déconnexion',
    
    // Basic translations
    welcomeBack: 'Bon retour',
    totalPatients: 'Total des patients',
    totalCases: 'Total des cas',
    thisMonth: 'Ce mois-ci',
    activePatients: 'Patients actifs'
  },
  es: {
    // Navigation
    dashboard: 'Panel de control',
    newCase: 'Nuevo caso',
    patients: 'Pacientes',
    aiTest: 'Prueba IA',
    settings: 'Configuración',
    profile: 'Perfil',
    logout: 'Cerrar sesión',
    
    // Basic translations
    welcomeBack: 'Bienvenido de vuelta',
    totalPatients: 'Total de pacientes',
    totalCases: 'Total de casos',
    thisMonth: 'Este mes',
    activePatients: 'Pacientes activos'
  },
  de: {
    // Navigation
    dashboard: 'Dashboard',
    newCase: 'Neuer Fall',
    patients: 'Patienten',
    aiTest: 'KI-Test',
    settings: 'Einstellungen',
    profile: 'Profil',
    logout: 'Abmelden',
    
    // Basic translations
    welcomeBack: 'Willkommen zurück',
    totalPatients: 'Gesamte Patienten',
    totalCases: 'Gesamte Fälle',
    thisMonth: 'Diesen Monat',
    activePatients: 'Aktive Patienten'
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });

  const [isRTL, setIsRTL] = useState(language === 'ar');

  useEffect(() => {
    localStorage.setItem('language', language);
    // RTL languages (Arabic, Hebrew, Persian, etc.)
    const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
    const isRightToLeft = rtlLanguages.includes(language);
    setIsRTL(isRightToLeft);
    
    // Update document direction
    document.documentElement.dir = isRightToLeft ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ar' : 'en');
  };

  const changeLanguage = (newLanguage) => {
    if (translations[newLanguage]) {
      setLanguage(newLanguage);
    }
  };

  const t = (key) => {
    return translations[language][key] || key;
  };

  const value = {
    language,
    isRTL,
    toggleLanguage,
    changeLanguage,
    setLanguage: changeLanguage, // Alias for consistency
    t
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}; 