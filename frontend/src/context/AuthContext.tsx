import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { setToken as setReduxToken, setLoading as setReduxLoading } from '../store/slices/authSlice';

interface AuthContextType {
  token: string | null;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    loadToken();
  }, []);

  const loadToken = async () => {
    const savedToken = await AsyncStorage.getItem('userToken');
    setToken(savedToken);
    dispatch(setReduxToken(savedToken));
    setLoading(false);
    dispatch(setReduxLoading(false));
  };

  const login = async (newToken: string) => {
    await AsyncStorage.setItem('userToken', newToken);
    setToken(newToken);
    dispatch(setReduxToken(newToken));
  };

  const logout = async () => {
    await AsyncStorage.removeItem('userToken');
    setToken(null);
    dispatch(setReduxToken(null));
  };

  return (
    <AuthContext.Provider value={{ token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
