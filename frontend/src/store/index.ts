import { create } from 'zustand'
import { message } from 'antd'
import { authApi, categoryApi } from '../api'
import type {
  User,
  Category,
  LoginParams,
  RegisterParams,
  UpdateProfileParams,
  ChangePasswordParams,
} from '../types'

const TOKEN_KEY = 'token'

export interface AppState {
  user: User | null
  token: string | null
  categories: Category[]
  isAuthenticated: boolean
  loading: boolean
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setCategories: (categories: Category[]) => void
  login: (params: LoginParams) => Promise<void>
  register: (params: RegisterParams) => Promise<void>
  logout: () => void
  fetchProfile: () => Promise<void>
  updateProfile: (params: UpdateProfileParams) => Promise<void>
  changePassword: (params: ChangePasswordParams) => Promise<void>
  fetchCategories: () => Promise<void>
  toggleLoading: (loading: boolean) => void
}

const useAppStore = create<AppState>((set, get) => ({
  user: null,
  token: localStorage.getItem(TOKEN_KEY),
  categories: [],
  isAuthenticated: !!localStorage.getItem(TOKEN_KEY),
  loading: false,

  setUser: (user) => set({ user }),

  setToken: (token) => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token)
      set({ token, isAuthenticated: true })
    } else {
      localStorage.removeItem(TOKEN_KEY)
      set({ token: null, isAuthenticated: false })
    }
  },

  setCategories: (categories) => set({ categories }),

  login: async (params) => {
    set({ loading: true })
    try {
      const { token, user } = await authApi.login(params)
      get().setToken(token)
      set({ user, loading: false })
      message.success('登录成功')
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  register: async (params) => {
    set({ loading: true })
    try {
      await authApi.register(params)
      set({ loading: false })
      message.success('注册成功，请登录')
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  logout: () => {
    get().setToken(null)
    set({ user: null, categories: [] })
    message.success('已退出登录')
  },

  fetchProfile: async () => {
    if (!get().isAuthenticated) return
    set({ loading: true })
    try {
      const user = await authApi.getProfile()
      set({ user, loading: false })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  updateProfile: async (params) => {
    set({ loading: true })
    try {
      const user = await authApi.updateProfile(params)
      set({ user, loading: false })
      message.success('个人信息更新成功')
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  changePassword: async (params) => {
    set({ loading: true })
    try {
      await authApi.changePassword(params)
      set({ loading: false })
      message.success('密码修改成功')
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  fetchCategories: async () => {
    set({ loading: true })
    try {
      const categories = await categoryApi.getCategories()
      set({ categories, loading: false })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  toggleLoading: (loading) => set({ loading }),
}))

export { useAppStore }
