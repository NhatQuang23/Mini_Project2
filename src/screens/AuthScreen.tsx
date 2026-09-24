import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBookingStore } from '../store/useBookingStore';
import { loadGoogleGsiScript, promptGoogleSignIn } from '../services/googleAuth';

export const AuthScreen: React.FC = () => {
  const login = useBookingStore((state) => state.login);
  const loginWithGoogle = useBookingStore((state) => state.loginWithGoogle);
  const register = useBookingStore((state) => state.register);

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Pre-load Google Sign-In script on web
  useEffect(() => {
    loadGoogleGsiScript();
  }, []);

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register Form States
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regName, setRegName] = useState('');
  const [regStudentId, setRegStudentId] = useState('');
  const [regFaculty, setRegFaculty] = useState('Faculty of Information Technology');
  const [regPhone, setRegPhone] = useState('');

  // UI status
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleLogin = async () => {
    setErrorMessage('');
    if (!loginEmail.trim()) {
      setErrorMessage('Please enter your username (Gmail)!');
      return;
    }
    if (!loginPassword) {
      setErrorMessage('Please enter your password!');
      return;
    }

    setIsLoading(true);
    const result = await login(loginEmail, loginPassword);
    setIsLoading(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Login failed.');
    }
  };

  const handleQuickLogin = async () => {
    setLoginEmail('quangpnn.23it@vku.udn.vn');
    setLoginPassword('123');
    setErrorMessage('');
    setIsLoading(true);
    await login('quangpnn.23it@vku.udn.vn', '123');
    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    setErrorMessage('');
    setIsGoogleLoading(true);

    try {
      const googleAuthRes = await promptGoogleSignIn();

      if (!googleAuthRes.success || !googleAuthRes.user) {
        setIsGoogleLoading(false);
        if (googleAuthRes.error) {
          setErrorMessage(googleAuthRes.error);
        }
        return;
      }

      // Login or register with real Google account data
      const result = await loginWithGoogle(googleAuthRes.user);
      setIsGoogleLoading(false);

      if (!result.success) {
        setErrorMessage(result.error || 'Google sign-in failed. Please try again.');
      }
    } catch (err: any) {
      setIsGoogleLoading(false);
      setErrorMessage(err.message || 'Lỗi kết nối với tài khoản Google.');
    }
  };

  const handleRegister = async () => {
    setErrorMessage('');
    if (!regEmail.trim()) {
      setErrorMessage('Please enter your username (Gmail)!');
      return;
    }
    if (!regEmail.includes('@')) {
      setErrorMessage('The username must be a valid Gmail address (containing @)!');
      return;
    }
    if (!regName.trim()) {
      setErrorMessage('Please enter the student full name!');
      return;
    }
    if (!regStudentId.trim()) {
      setErrorMessage('Please enter your student ID (e.g., 23IT220)!');
      return;
    }
    if (!regPassword || regPassword.length < 3) {
      setErrorMessage('The password requires at least 3 characters!');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage('The confirmation password does not match!');
      return;
    }

    setIsLoading(true);
    const result = await register({
      email: regEmail,
      password: regPassword,
      name: regName,
      studentId: regStudentId,
      faculty: regFaculty || 'Faculty of Information Technology',
      phone: regPhone || '+84 774505325',
      avatarUrl: 'local:avatar-quang',
    });
    setIsLoading(false);

    if (result.success) {
      if (Platform.OS === 'web') {
        alert('Account registration successful! You have been logged in.');
      } else {
        Alert.alert('Success 🎉', 'Account registration successful!');
      }
    } else {
      setErrorMessage(result.error || 'Registration failed.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Branding */}
          <View style={styles.brandingCard}>
            <View style={styles.iconCircle}>
              <Ionicons name="school" size={32} color="#0052CC" />
            </View>
            <Text style={styles.univName}>VIETNAM - KOREA UNIVERSITY</Text>
            <Text style={styles.appTitle}>VKU Study Room & Lab Booking</Text>
            <Text style={styles.subSubtitle}>
              VKU Group Study Room & Tech Lab Booking System
            </Text>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'login' && styles.tabButtonActive]}
              onPress={() => {
                setActiveTab('login');
                setErrorMessage('');
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="log-in-outline"
                size={18}
                color={activeTab === 'login' ? '#0052CC' : '#64748B'}
              />
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === 'login' && styles.tabButtonTextActive,
                ]}
              >
                Log in
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'register' && styles.tabButtonActive]}
              onPress={() => {
                setActiveTab('register');
                setErrorMessage('');
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="person-add-outline"
                size={18}
                color={activeTab === 'register' ? '#0052CC' : '#64748B'}
              />
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === 'register' && styles.tabButtonTextActive,
                ]}
              >
                Register
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Banner */}
          {errorMessage ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#DC2626" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Form Content */}
          <View style={styles.formCard}>
            {activeTab === 'login' ? (
              // LOGIN FORM
              <View>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    Username (Gmail) <Text style={styles.requiredMark}>*</Text>
                  </Text>
                  <View style={styles.inputBox}>
                    <Ionicons name="mail-outline" size={18} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="ví dụ: quangpnn.23it@vku.udn.vn"
                      placeholderTextColor="#94A3B8"
                      value={loginEmail}
                      onChangeText={(t) => {
                        setLoginEmail(t);
                        if (errorMessage) setErrorMessage('');
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    Password <Text style={styles.requiredMark}>*</Text>
                  </Text>
                  <View style={styles.inputBox}>
                    <Ionicons name="lock-closed-outline" size={18} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Nhập mật khẩu..."
                      placeholderTextColor="#94A3B8"
                      value={loginPassword}
                      onChangeText={(t) => {
                        setLoginPassword(t);
                        if (errorMessage) setErrorMessage('');
                      }}
                      secureTextEntry={!showLoginPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowLoginPassword(!showLoginPassword)}
                      style={styles.eyeBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name={showLoginPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color="#64748B"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Submit Login Button */}
                <TouchableOpacity
                  style={[styles.primaryButton, isLoading && styles.disabledButton]}
                  onPress={handleLogin}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <Ionicons name="log-in" size={18} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>
                    {isLoading ? 'Authenticating...' : 'Log in to the system'}
                  </Text>
                </TouchableOpacity>

                {/* Google Sign-In Button */}
                <TouchableOpacity
                  style={[styles.googleButton, isGoogleLoading && styles.disabledButton]}
                  onPress={handleGoogleLogin}
                  disabled={isGoogleLoading || isLoading}
                  activeOpacity={0.85}
                >
                  {isGoogleLoading ? (
                    <Text style={styles.googleButtonText}>Signing in with Google...</Text>
                  ) : (
                    <>
                      <View style={styles.googleIconBox}>
                        <Text style={styles.googleG}>G</Text>
                      </View>
                      <Text style={styles.googleButtonText}>Continue with Google</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Quick Login Helper */}
                <TouchableOpacity
                  style={styles.quickLoginButton}
                  onPress={handleQuickLogin}
                  activeOpacity={0.7}
                >
                  <View style={styles.quickLoginIconBox}>
                    <Ionicons name="flash" size={18} color="#0052CC" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.quickLoginTitle}>
                      Quick login with student account
                    </Text>
                    <Text style={styles.quickLoginDesc}>
                      Phan Nguyễn Nhật Quang • Student ID: 23IT220
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            ) : (
              // REGISTER FORM
              <View>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    Username (Student Gmail) <Text style={styles.requiredMark}>*</Text>
                  </Text>
                  <View style={styles.inputBox}>
                    <Ionicons name="mail-outline" size={18} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="ví dụ: quangpnn.23it@vku.udn.vn"
                      placeholderTextColor="#94A3B8"
                      value={regEmail}
                      onChangeText={(t) => {
                        setRegEmail(t);
                        if (errorMessage) setErrorMessage('');
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    Student's full name <Text style={styles.requiredMark}>*</Text>
                  </Text>
                  <View style={styles.inputBox}>
                    <Ionicons name="person-outline" size={18} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="ví dụ: Phan Nguyễn Nhật Quang"
                      placeholderTextColor="#94A3B8"
                      value={regName}
                      onChangeText={(t) => {
                        setRegName(t);
                        if (errorMessage) setErrorMessage('');
                      }}
                    />
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    Student ID Number (Student ID) <Text style={styles.requiredMark}>*</Text>
                  </Text>
                  <View style={styles.inputBox}>
                    <Ionicons name="card-outline" size={18} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="ví dụ: 23IT220"
                      placeholderTextColor="#94A3B8"
                      value={regStudentId}
                      onChangeText={(t) => {
                        setRegStudentId(t);
                        if (errorMessage) setErrorMessage('');
                      }}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Faculty / Field of Study</Text>
                  <View style={styles.inputBox}>
                    <Ionicons name="business-outline" size={18} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Faculty of Information Technology"
                      placeholderTextColor="#94A3B8"
                      value={regFaculty}
                      onChangeText={(t) => {
                        setRegFaculty(t);
                        if (errorMessage) setErrorMessage('');
                      }}
                    />
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Phone</Text>
                  <View style={styles.inputBox}>
                    <Ionicons name="call-outline" size={18} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="ví dụ: 0774505325"
                      placeholderTextColor="#94A3B8"
                      value={regPhone}
                      onChangeText={(t) => {
                        setRegPhone(t);
                        if (errorMessage) setErrorMessage('');
                      }}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    Password <Text style={styles.requiredMark}>*</Text>
                  </Text>
                  <View style={styles.inputBox}>
                    <Ionicons name="lock-closed-outline" size={18} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Minimum of 3 characters..."
                      placeholderTextColor="#94A3B8"
                      value={regPassword}
                      onChangeText={(t) => {
                        setRegPassword(t);
                        if (errorMessage) setErrorMessage('');
                      }}
                      secureTextEntry={!showRegPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowRegPassword(!showRegPassword)}
                      style={styles.eyeBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name={showRegPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color="#64748B"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    Confirm password <Text style={styles.requiredMark}>*</Text>
                  </Text>
                  <View style={styles.inputBox}>
                    <Ionicons name="shield-checkmark-outline" size={18} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Re-enter password..."
                      placeholderTextColor="#94A3B8"
                      value={regConfirmPassword}
                      onChangeText={(t) => {
                        setRegConfirmPassword(t);
                        if (errorMessage) setErrorMessage('');
                      }}
                      secureTextEntry={!showRegPassword}
                    />
                  </View>
                </View>

                {/* Submit Register Button */}
                <TouchableOpacity
                  style={[styles.primaryButton, isLoading && styles.disabledButton]}
                  onPress={handleRegister}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>
                    {isLoading ? 'Creating account...' : 'Sign up for an account now'}
                  </Text>
                </TouchableOpacity>

                {/* Google Sign-Up Button */}
                <TouchableOpacity
                  style={[styles.googleButton, isGoogleLoading && styles.disabledButton]}
                  onPress={handleGoogleLogin}
                  disabled={isGoogleLoading || isLoading}
                  activeOpacity={0.85}
                >
                  {isGoogleLoading ? (
                    <Text style={styles.googleButtonText}>Connecting to Google...</Text>
                  ) : (
                    <>
                      <View style={styles.googleIconBox}>
                        <Text style={styles.googleG}>G</Text>
                      </View>
                      <Text style={styles.googleButtonText}>Sign up with Google</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Footer Info */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Vietnam-Korea University of Information and Communication Technology
            </Text>
            <Text style={styles.footerSubText}>
              The University of Danang • 470 Trần Đại Nghĩa, Ngũ Hành Sơn, Đà Nẵng
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 40,
  },
  brandingCard: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E6F4FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#BAE6FD',
  },
  univName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0052CC',
    letterSpacing: 1.2,
    marginBottom: 4,
    textAlign: 'center',
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 4,
  },
  subSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabButtonTextActive: {
    color: '#0052CC',
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  requiredMark: {
    color: '#DC2626',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    height: '100%',
  },
  eyeBtn: {
    padding: 6,
  },
  primaryButton: {
    backgroundColor: '#0052CC',
    borderRadius: 10,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    shadowColor: '#0052CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  quickLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F7FF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  quickLoginIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLoginTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0052CC',
  },
  quickLoginDesc: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  footerSubText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 3,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    height: 48,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  googleIconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleG: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
});
