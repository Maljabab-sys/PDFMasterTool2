import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem,
  Divider,
  Avatar,
  AppBar,
  Toolbar,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  AddBox as AddBoxIcon,
  People as PeopleIcon,
  Psychology as PsychologyIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountCircleIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Notifications as NotificationsIcon,
  Language as LanguageIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCustomTheme } from '../../App';

const expandedWidth = 220;
const collapsedWidth = 64;

const Navigation = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const { darkMode, toggleDarkMode } = useCustomTheme();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const profileButtonRef = useRef(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [languageMenuAnchor, setLanguageMenuAnchor] = useState(null);

  const navigationItems = [
    { path: '/dashboard', label: t('dashboard'), icon: <DashboardIcon /> },
    { path: '/new-case', label: t('newCase'), icon: <AddBoxIcon /> },
    { path: '/patients', label: t('patients'), icon: <PeopleIcon /> },
    { path: '/ai-test', label: t('aiTest'), icon: <PsychologyIcon /> },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLanguageMenuOpen = (event) => {
    setLanguageMenuAnchor(event.currentTarget);
  };

  const handleLanguageMenuClose = () => {
    setLanguageMenuAnchor(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleUserMenuClose();
  };

  const isCurrentPath = (path) => location.pathname === path;

  // Sidebar content
  const drawer = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        borderRight: `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* Header with toggle button */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          p: 2,
          minHeight: 64,
        }}
      >
        {!collapsed && (
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
            DentalAI
          </Typography>
        )}
        {!isMobile && (
          <IconButton
            onClick={() => setCollapsed(!collapsed)}
            sx={{
              bgcolor: 'action.hover',
              '&:hover': { bgcolor: 'action.selected' },
            }}
          >
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        )}
      </Box>

      <Divider />

      {/* Navigation items */}
      <List sx={{ flexGrow: 1, px: 1 }}>
        {navigationItems.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => {
                handleNavigation(item.path);
              }}
              selected={isCurrentPath(item.path)}
              sx={{
                borderRadius: 2,
                minHeight: 48,
                justifyContent: collapsed ? 'center' : 'flex-start',
                px: 2.5,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText',
                  },
                },
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: collapsed ? 0 : 3,
                  justifyContent: 'center',
                }}
              >
                {item.icon}
              </ListItemIcon>
              {!collapsed && <ListItemText primary={item.label} />}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Top AppBar with Profile and other icons */}
      <AppBar
        position="fixed"
        color="default"
        elevation={0}
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: 'background.paper',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setMobileOpen(true)}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          {!isMobile && <Box />} {/* Spacer for desktop */}
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Notifications */}
            <IconButton color="inherit">
              <Badge badgeContent={3} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>

            {/* Language Selector */}
            <IconButton color="inherit" onClick={handleLanguageMenuOpen}>
              <LanguageIcon />
            </IconButton>
            <Menu
              anchorEl={languageMenuAnchor}
              open={Boolean(languageMenuAnchor)}
              onClose={handleLanguageMenuClose}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              PaperProps={{
                sx: {
                  mt: 1,
                  borderRadius: 2,
                  minWidth: 150,
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 8px 30px rgba(0,0,0,0.4)'
                    : '0 8px 30px rgba(0,0,0,0.12)',
                  border: `1px solid ${theme.palette.divider}`,
                },
              }}
            >
              <MenuItem 
                onClick={() => { 
                  if (language !== 'en') toggleLanguage(); 
                  handleLanguageMenuClose(); 
                }}
                selected={language === 'en'}
              >
                English
              </MenuItem>
              <MenuItem 
                onClick={() => { 
                  if (language !== 'ar') toggleLanguage(); 
                  handleLanguageMenuClose(); 
                }}
                selected={language === 'ar'}
              >
                العربية
              </MenuItem>
            </Menu>

            {/* Dark Mode Toggle */}
            <IconButton color="inherit" onClick={toggleDarkMode}>
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>

            {/* Profile */}
            <IconButton
              ref={profileButtonRef}
              color="primary"
              onClick={handleUserMenuOpen}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                <AccountCircleIcon />
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={userMenuAnchor}
              open={Boolean(userMenuAnchor)}
              onClose={handleUserMenuClose}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              PaperProps={{
                sx: {
                  mt: 1,
                  borderRadius: 2,
                  minWidth: 200,
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 8px 30px rgba(0,0,0,0.4)'
                    : '0 8px 30px rgba(0,0,0,0.12)',
                  border: `1px solid ${theme.palette.divider}`,
                },
              }}
            >
              <MenuItem onClick={() => { navigate('/settings'); handleUserMenuClose(); }}>
                <SettingsIcon sx={{ mr: 2, fontSize: 20 }} />
                {t('settings')}
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                <LogoutIcon sx={{ mr: 2, fontSize: 20 }} />
                {t('logout')}
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Desktop Sidebar */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: collapsed ? collapsedWidth : expandedWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: collapsed ? collapsedWidth : expandedWidth,
              boxSizing: 'border-box',
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              mt: 8, // Add margin top to account for AppBar
            },
          }}
        >
          {drawer}
        </Drawer>
      )}

      {/* Mobile Sidebar */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: expandedWidth,
              boxSizing: 'border-box',
              mt: 8, // Add margin top to account for AppBar
            },
          }}
        >
          {drawer}
        </Drawer>
      )}

      {/* Main content area - Adaptive to sidebar */}
      <Box
        sx={{
          flexGrow: 1,
          minHeight: '100vh',
          bgcolor: 'background.default',
          ml: isMobile ? 0 : collapsed ? `${collapsedWidth}px` : `${expandedWidth}px`,
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          pt: 8, // Add padding top for AppBar
        }}
      >
        {/* Main content */}
        <Box sx={{ p: { xs: 2, md: 4 } }}>
          {typeof children !== 'undefined' ? children : null}
        </Box>
      </Box>
    </Box>
  );
};

export default Navigation; 