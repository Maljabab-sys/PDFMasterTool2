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
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
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
import { useSidebar } from '../../contexts/SidebarContext';

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
  const { collapsed, toggleSidebar } = useSidebar();

  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Debug: Log when collapsed state changes
  React.useEffect(() => {
    console.log('Navigation: collapsed state changed to:', collapsed);
  }, [collapsed]);
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
        borderRadius: 0, // Remove rounded corners
      }}
    >
      {/* Header with toggle button - moved to top for mobile */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: isMobile ? 1 : 1,
          minHeight: isMobile ? 48 : 48,
          order: isMobile ? -1 : 0, // Move to top on mobile
          borderBottom: isMobile ? `1px solid ${theme.palette.divider}` : 'none',
          mb: isMobile ? '-1px' : 0, // Negative margin to overlap with List
        }}
      >
        {!isMobile && (
          <IconButton
            size="medium"
            onClick={() => {
              console.log('Toggle button clicked, current collapsed state:', collapsed);
              toggleSidebar();
            }}
            sx={{
              bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
              '&:hover': { 
                bgcolor: theme.palette.mode === 'dark' ? 'grey.700' : 'grey.200',
                transform: 'scale(1.05)'
              },
              borderRadius: 2,
              p: 1.5,
              minWidth: 48,
              minHeight: 48,
              display: 'flex',
              visibility: 'visible',
              transition: 'all 0.2s ease-in-out',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              color: 'white',
            }}
          >
            {collapsed ? <ChevronRightIcon fontSize="medium" /> : <ChevronLeftIcon fontSize="medium" />}
          </IconButton>
        )}
        {isMobile && (
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            Menu
          </Typography>
        )}
      </Box>

      {/* Navigation items */}
      <List 
        disablePadding
        sx={{ 
          flexGrow: 1, 
          px: 1, 
          pt: 0, 
          mt: isMobile ? '-1px' : 0, // Negative margin to eliminate gap on mobile
          pb: 0,
          '& .MuiList-root': { 
            pt: 0, 
            pb: 0 
          },
          '& .MuiList-padding': {
            pt: 0,
            pb: 0
          }
        }}
      >
        {navigationItems.map((item) => (
                      <ListItem key={item.path} disablePadding sx={{ mb: 0 }}>
            <Tooltip title={collapsed ? item.label : ""} placement="right">
              <ListItemButton
                onClick={() => {
                  handleNavigation(item.path);
                }}
                selected={isCurrentPath(item.path)}
                sx={{
                  borderRadius: 1, // Reduced border radius
                  minHeight: 48,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  px: 2.5,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    borderRadius: 1, // Reduced border radius for selected state
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'primary.contrastText',
                    },
                  },
                  '&:hover': {
                    bgcolor: 'action.hover',
                    borderRadius: 1, // Reduced border radius for hover state
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
            </Tooltip>
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
          borderRadius: 0, // Remove rounded corners
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          {/* Left side - Mobile menu button or Brand name */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isMobile && (
              <IconButton
                color="inherit"
                edge="start"
                onClick={() => setMobileOpen(!mobileOpen)}
                sx={{ mr: 2 }}
              >
                {mobileOpen ? <CloseIcon /> : <MenuIcon />}
              </IconButton>
            )}
            
            {/* Brand Name */}
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700, 
                color: 'primary.main',
                cursor: 'pointer',
                '&:hover': {
                  color: 'primary.dark',
                }
              }}
              onClick={() => navigate('/dashboard')}
            >
              DentalAI
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton color="inherit">
                <Badge badgeContent={3} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Language Selector */}
            <Tooltip title="Language">
              <IconButton color="inherit" onClick={handleLanguageMenuOpen}>
                <LanguageIcon />
              </IconButton>
            </Tooltip>
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
            <Tooltip title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
              <IconButton color="inherit" onClick={toggleDarkMode}>
                {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>

            {/* Profile */}
            <Tooltip title="Profile">
              <IconButton
                ref={profileButtonRef}
                color="primary"
                onClick={handleUserMenuOpen}
              >
                <Avatar 
                  sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}
                  src={user?.profileImage}
                >
                  {!user?.profileImage && <AccountCircleIcon />}
                </Avatar>
              </IconButton>
            </Tooltip>
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
              transition: theme.transitions.create(['width', 'transform'], {
                easing: theme.transitions.easing.easeInOut,
                duration: theme.transitions.duration.standard,
              }),
              mt: 8, // Add margin top to account for AppBar (64px = 8 * 8px)
              height: 'calc(100vh - 64px)', // Full height minus AppBar
              transform: collapsed ? 'translateX(0)' : 'translateX(0)',
              boxShadow: collapsed 
                ? '2px 0 8px rgba(0,0,0,0.1)' 
                : '4px 0 12px rgba(0,0,0,0.15)',
              borderRadius: 0, // Remove rounded corners
              '& .MuiPaper-root': {
                borderRadius: 0, // Remove rounded corners from paper
              }
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
              mt: 0, // Remove margin top to touch AppBar
              height: '100vh', // Full height to touch top
              borderRadius: 0, // Remove rounded corners
              '& .MuiPaper-root': {
                borderRadius: 0, // Remove rounded corners from paper
              }
            },
          }}
        >
          {drawer}
        </Drawer>
      )}

      {/* Main content area - Animated positioning */}
      <Box
        sx={{
          flexGrow: 1,
          minHeight: '100vh',
          bgcolor: 'background.default',
          ml: 0, // Remove margin-left to make content touch sidebar
          transition: theme.transitions.create(['margin', 'transform'], {
            easing: theme.transitions.easing.easeInOut,
            duration: theme.transitions.duration.standard,
          }),
          pt: 7, // Add padding top for AppBar (reduced spacing)
        }}
      >
        {/* Main content */}
        <Box sx={{ 
          pl: { 
            xs: 1, 
            md: 2 
          },
          pr: { xs: 1, md: 1 },
          py: { xs: 1, md: 1 },
          position: 'relative'
        }}>
          {typeof children !== 'undefined' ? children : null}
        </Box>
      </Box>
    </Box>
  );
};

export default Navigation; 