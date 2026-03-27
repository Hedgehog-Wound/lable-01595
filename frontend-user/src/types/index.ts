// 通用响应类型
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 分页参数
export interface PageParams {
  page: number
  pageSize: number
}

// 分页响应
export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

// 用户信息
export interface UserInfo {
  id: string
  username: string
  nickname: string
  avatar: string
  role: 'admin' | 'user'
  email: string
  phone: string
  createTime: string
}

// 登录表单
export interface LoginForm {
  username: string
  password: string
}

// 菜单项
export interface MenuItem {
  path: string
  title: string
  icon: string
  children?: MenuItem[]
}
