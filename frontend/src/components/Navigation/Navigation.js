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
  const { t, language, toggleLanguage, changeLanguage } = useLanguage();
  const { darkMode, toggleDarkMode } = useCustomTheme();
  const { collapsed, toggleSidebar } = useSidebar();

  const [mobileOpen, setMobileOpen] = useState(false);
  
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
                transform: 'scale(1.1) rotate(5deg)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              },
              borderRadius: 2,
              p: 1.5,
              minWidth: 48,
              minHeight: 48,
              display: 'flex',
              visibility: 'visible',
              transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              color: theme.palette.mode === 'dark' ? 'white' : 'text.primary', // Fix arrow color visibility
              '& .MuiSvgIcon-root': {
                transition: 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
                color: theme.palette.mode === 'dark' ? 'white' : 'text.primary', // Ensure icon color is visible
              }
            }}
          >
            <ChevronLeftIcon fontSize="medium" />
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
                  transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    width: '3px',
                    bgcolor: 'primary.main',
                    transform: isCurrentPath(item.path) ? 'scaleY(1)' : 'scaleY(0)',
                    transformOrigin: 'center',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                  },
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    borderRadius: 1, // Reduced border radius for selected state
                    transform: 'translateX(4px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                      transform: 'translateX(6px)',
                      boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'primary.contrastText',
                      transform: 'scale(1.1)',
                    },
                  },
                  '&:hover': {
                    bgcolor: 'action.hover',
                    borderRadius: 1, // Reduced border radius for hover state
                    transform: isCurrentPath(item.path) ? 'translateX(6px)' : 'translateX(2px)',
                    '& .MuiListItemIcon-root': {
                      transform: 'scale(1.05)',
                    },
                  },
                  '& .MuiListItemIcon-root': {
                    transition: 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                  },
                  '& .MuiListItemText-root': {
                    opacity: collapsed ? 0 : 1,
                    transition: 'opacity 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                  }
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
                sx={{ 
                  mr: 2,
                  transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                  borderRadius: 2,
                  '&:hover': {
                    bgcolor: 'action.hover',
                    transform: 'scale(1.1)',
                  },
                  '&:active': {
                    transform: 'scale(0.95)',
                  },
                  '& .MuiSvgIcon-root': {
                    transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                    transform: mobileOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  }
                }}
              >
                {mobileOpen ? (
                  <CloseIcon sx={{ 
                    color: 'error.main',
                    animation: 'fadeIn 0.3s ease-in-out',
                    '@keyframes fadeIn': {
                      '0%': { opacity: 0, transform: 'rotate(-90deg) scale(0.8)' },
                      '100%': { opacity: 1, transform: 'rotate(0deg) scale(1)' },
                    }
                  }} />
                ) : (
                  <MenuIcon sx={{ 
                    animation: 'fadeIn 0.3s ease-in-out',
                    '@keyframes fadeIn': {
                      '0%': { opacity: 0, transform: 'rotate(90deg) scale(0.8)' },
                      '100%': { opacity: 1, transform: 'rotate(0deg) scale(1)' },
                    }
                  }} />
                )}
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
            <Tooltip title="Notifications" arrow>
              <IconButton 
                color="inherit"
                sx={{
                  transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                  borderRadius: 2,
                  '&:hover': {
                    bgcolor: 'action.hover',
                    transform: 'scale(1.1)',
                    '& .MuiSvgIcon-root': {
                      animation: 'shake 0.5s ease-in-out',
                    },
                    '& .MuiBadge-badge': {
                      animation: 'pulse 1s infinite',
                    }
                  },
                  '&:active': {
                    transform: 'scale(0.95)',
                  },
                  '@keyframes shake': {
                    '0%, 100%': { transform: 'rotate(0deg)' },
                    '25%': { transform: 'rotate(-10deg)' },
                    '75%': { transform: 'rotate(10deg)' },
                  },
                  '@keyframes pulse': {
                    '0%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.2)' },
                    '100%': { transform: 'scale(1)' },
                  }
                }}
              >
                <Badge 
                  badgeContent={3} 
                  color="error"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.6rem',
                      height: 16,
                      minWidth: 16,
                      padding: '0 4px',
                    }
                  }}
                >
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Language Selector */}
            <Tooltip title="Language" arrow>
              <IconButton 
                color="inherit" 
                onClick={handleLanguageMenuOpen}
                sx={{
                  transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                  borderRadius: 2,
                  '&:hover': {
                    bgcolor: 'action.hover',
                    transform: 'scale(1.1) rotate(5deg)',
                    '& .MuiSvgIcon-root': {
                      color: 'primary.main',
                    }
                  },
                  '&:active': {
                    transform: 'scale(0.95)',
                  }
                }}
              >
                <LanguageIcon />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={languageMenuAnchor}
              open={Boolean(languageMenuAnchor)}
              onClose={handleLanguageMenuClose}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              TransitionProps={{
                timeout: 400,
                style: {
                  transformOrigin: 'top right',
                },
              }}
              sx={{
                '& .MuiPaper-root': {
                  transformOrigin: 'top right !important',
                  animation: Boolean(languageMenuAnchor) ? 'slideDown 0.4s cubic-bezier(0.4, 0.0, 0.2, 1)' : 'none',
                },
                '@keyframes slideDown': {
                  '0%': {
                    opacity: 0,
                    transform: 'scale(0.8) translateY(-10px)',
                  },
                  '100%': {
                    opacity: 1,
                    transform: 'scale(1) translateY(0)',
                  },
                },
              }}
              PaperProps={{
                sx: {
                  mt: 1,
                  borderRadius: 3,
                  minWidth: 200,
                  maxHeight: 300,
                  overflowY: 'auto',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 12px 40px rgba(0,0,0,0.5)'
                    : '0 12px 40px rgba(0,0,0,0.15)',
                  border: `1px solid ${theme.palette.divider}`,
                  backdropFilter: 'blur(10px)',
                  background: theme.palette.mode === 'dark' 
                    ? 'rgba(18, 18, 18, 0.9)' 
                    : 'rgba(255, 255, 255, 0.9)',
                  '& .MuiMenuItem-root': {
                    borderRadius: 2,
                    mx: 1,
                    my: 0.5,
                    transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
                    '&:hover': {
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      transform: 'translateX(4px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    },
                    '&.Mui-selected': {
                      bgcolor: 'primary.light',
                      color: 'primary.contrastText',
                      '&:hover': {
                        bgcolor: 'primary.main',
                      }
                    }
                  }
                },
              }}
            >
              <MenuItem 
                onClick={() => { 
                  if (language !== 'en') changeLanguage('en'); 
                  handleLanguageMenuClose(); 
                }}
                selected={language === 'en'}
              >
                English
              </MenuItem>
              <MenuItem 
                onClick={() => { 
                  if (language !== 'ar') changeLanguage('ar'); 
                  handleLanguageMenuClose(); 
                }}
                selected={language === 'ar'}
              >
                العربية
              </MenuItem>
              <MenuItem 
                onClick={() => { 
                  if (language !== 'fr') changeLanguage('fr'); 
                  handleLanguageMenuClose(); 
                }}
                selected={language === 'fr'}
              >
                Français
              </MenuItem>
              <MenuItem 
                onClick={() => { 
                  if (language !== 'es') changeLanguage('es'); 
                  handleLanguageMenuClose(); 
                }}
                selected={language === 'es'}
              >
                Español
              </MenuItem>
              <MenuItem 
                onClick={() => { 
                  if (language !== 'de') changeLanguage('de'); 
                  handleLanguageMenuClose(); 
                }}
                selected={language === 'de'}
              >
                Deutsch
              </MenuItem>
            </Menu>

            {/* Dark Mode Toggle */}
            <Tooltip title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"} arrow>
              <IconButton 
                color="inherit" 
                onClick={toggleDarkMode}
                sx={{
                  transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                  borderRadius: 2,
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    transform: 'scale(1.1)',
                    '& .MuiSvgIcon-root': {
                      color: darkMode ? '#FFA726' : '#42A5F5',
                      filter: darkMode ? 'drop-shadow(0 0 8px #FFA726)' : 'drop-shadow(0 0 8px #42A5F5)',
                      animation: darkMode ? 'glow 2s ease-in-out infinite alternate' : 'rotate 1s ease-in-out',
                    }
                  },
                  '&:active': {
                    transform: 'scale(0.95)',
                  },
                  '@keyframes glow': {
                    '0%': { filter: 'drop-shadow(0 0 5px #FFA726)' },
                    '100%': { filter: 'drop-shadow(0 0 15px #FFA726)' },
                  },
                  '@keyframes rotate': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(180deg)' },
                  }
                }}
              >
                {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>

            {/* Profile */}
            <Tooltip title="Profile" arrow>
              <IconButton
                ref={profileButtonRef}
                color="primary"
                onClick={handleUserMenuOpen}
                sx={{
                  transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                  borderRadius: 2,
                  p: 0.5,
                  '&:hover': {
                    bgcolor: 'action.hover',
                    transform: 'scale(1.1)',
                    '& .MuiAvatar-root': {
                      boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.3)',
                      transform: 'scale(1.05)',
                    }
                  },
                  '&:active': {
                    transform: 'scale(0.95)',
                  }
                }}
              >
                <Avatar 
                  sx={{ 
                    width: 32, 
                    height: 32, 
                    bgcolor: 'primary.main',
                    transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                    border: '2px solid transparent',
                  }}
                  src={user?.profileImage || undefined}
                >
                  {!user?.profileImage && (user?.fullName?.charAt(0) || user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U')}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={userMenuAnchor}
              open={Boolean(userMenuAnchor)}
              onClose={handleUserMenuClose}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              TransitionProps={{
                timeout: 400,
                style: {
                  transformOrigin: 'top right',
                },
              }}
              sx={{
                '& .MuiPaper-root': {
                  transformOrigin: 'top right !important',
                  animation: Boolean(userMenuAnchor) ? 'slideDown 0.4s cubic-bezier(0.4, 0.0, 0.2, 1)' : 'none',
                },
                '@keyframes slideDown': {
                  '0%': {
                    opacity: 0,
                    transform: 'scale(0.8) translateY(-10px)',
                  },
                  '100%': {
                    opacity: 1,
                    transform: 'scale(1) translateY(0)',
                  },
                },
              }}
              PaperProps={{
                sx: {
                  mt: 1,
                  borderRadius: 3,
                  minWidth: 220,
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 12px 40px rgba(0,0,0,0.5)'
                    : '0 12px 40px rgba(0,0,0,0.15)',
                  border: `1px solid ${theme.palette.divider}`,
                  backdropFilter: 'blur(10px)',
                  background: theme.palette.mode === 'dark' 
                    ? 'rgba(18, 18, 18, 0.9)' 
                    : 'rgba(255, 255, 255, 0.9)',
                  overflow: 'visible',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: -8,
                    right: 14,
                    width: 16,
                    height: 16,
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'rgba(18, 18, 18, 0.9)' 
                      : 'rgba(255, 255, 255, 0.9)',
                    border: `1px solid ${theme.palette.divider}`,
                    borderBottom: 'none',
                    borderRight: 'none',
                    transform: 'rotate(45deg)',
                  }
                },
              }}
            >
              {/* User Info Header */}
              <Box sx={{ 
                px: 2, 
                py: 1.5, 
                borderBottom: `1px solid ${theme.palette.divider}`,
                mb: 1
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar 
                    sx={{ 
                      width: 40, 
                      height: 40, 
                      bgcolor: 'primary.main',
                    }}
                    src={user?.profileImage || undefined}
                  >
                    {!user?.profileImage && (user?.fullName?.charAt(0) || user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U')}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {user?.full_name || user?.fullName || user?.email?.split('@')[0] || 'User'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user?.email || 'user@example.com'}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <MenuItem 
                onClick={() => { navigate('/settings'); handleUserMenuClose(); }}
                sx={{
                  borderRadius: 2,
                  mx: 1,
                  my: 0.5,
                  transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
                  '&:hover': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    transform: 'translateX(4px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    '& .MuiSvgIcon-root': {
                      transform: 'rotate(90deg)',
                    }
                  }
                }}
              >
                <SettingsIcon sx={{ 
                  mr: 2, 
                  fontSize: 20,
                  transition: 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)'
                }} />
                {t('settings')}
              </MenuItem>
              <Divider sx={{ mx: 1 }} />
              <MenuItem 
                onClick={handleLogout} 
                sx={{ 
                  color: 'error.main',
                  borderRadius: 2,
                  mx: 1,
                  my: 0.5,
                  transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
                  '&:hover': {
                    bgcolor: 'error.main',
                    color: 'error.contrastText',
                    transform: 'translateX(4px)',
                    boxShadow: '0 4px 12px rgba(211, 47, 47, 0.3)',
                    '& .MuiSvgIcon-root': {
                      transform: 'translateX(2px)',
                    }
                  }
                }}
              >
                <LogoutIcon sx={{ 
                  mr: 2, 
                  fontSize: 20,
                  transition: 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)'
                }} />
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
              transition: theme.transitions.create(['width', 'transform', 'box-shadow'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              mt: 8, // Add margin top to account for AppBar (64px = 8 * 8px)
              height: 'calc(100vh - 64px)', // Full height minus AppBar
              transform: 'translateX(0)',
              boxShadow: collapsed 
                ? '2px 0 8px rgba(0,0,0,0.1)' 
                : '4px 0 12px rgba(0,0,0,0.15)',
              borderRadius: 0, // Remove rounded corners
              overflow: 'hidden',
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
          ModalProps={{ 
            keepMounted: true,
            sx: {
              '& .MuiBackdrop-root': {
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(4px)',
              }
            }
          }}
          SlideProps={{
            direction: 'right',
            timeout: {
              enter: theme.transitions.duration.enteringScreen,
              exit: theme.transitions.duration.leavingScreen,
            }
          }}
          sx={{
            '& .MuiDrawer-paper': {
              width: expandedWidth,
              boxSizing: 'border-box',
              mt: 0, // Remove margin top to touch AppBar
              height: '100vh', // Full height to touch top
              borderRadius: 0, // Remove rounded corners
              transform: mobileOpen ? 'translateX(0)' : `translateX(-${expandedWidth}px)`,
              transition: theme.transitions.create(['transform'], {
                easing: theme.transitions.easing.sharp,
                duration: mobileOpen 
                  ? theme.transitions.duration.enteringScreen 
                  : theme.transitions.duration.leavingScreen,
              }),
              boxShadow: '4px 0 20px rgba(0,0,0,0.15)',
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
          ml: 0, // Remove margin so content touches navigation
          transition: theme.transitions.create(['margin-left', 'transform'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          pt: 8, // Add padding top for AppBar
          transform: 'translateX(0)',
        }}
      >
        {/* Main content */}
        <Box sx={{ 
          pl: 0, // Remove all left padding
          pr: 0, // Remove all right padding too for consistency
          py: 0, // Remove all vertical padding
          position: 'relative',
        }}>
          {typeof children !== 'undefined' ? children : null}
        </Box>
      </Box>
    </Box>
  );
};

export default Navigation; 