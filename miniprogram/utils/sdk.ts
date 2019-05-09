const TOKEN_NAME: string = 'certificate-manager-token'

class Client {
  public static client: Client = null
  private readonly serverURL: string
  private readonly tokenName: string
  private token: string | null = null

  constructor(params: {serverURL: string, tokenPrefix?: string}) {
      this.serverURL = params.serverURL + '/api'
      this.tokenName = (params.tokenPrefix || '') + TOKEN_NAME
      let tokenStorage = wx.getStorageSync(this.tokenName)
      if(tokenStorage != null) {
          this.token = tokenStorage
      }
  }

  setToken(token: string | null): void {
    this.token = token
    if (token) {
      wx.setStorageSync(this.tokenName, token)
    } else if (wx.getStorageSync(this.tokenName) != null) {
      wx.removeStorageSync(this.tokenName)
    }
  }

  private getURL(url: string): string {
      return `${this.serverURL}${url}/`
  }
  private getDetailURL(url: string, id: any): string {
      return `${this.serverURL}${url}/${encodeURIComponent(id)}/`
  }
  private getHeaders(contentType?: string): Object {
      let ret: any = {}
      if(this.token) ret['Authorization'] = `Token ${this.token}`
      if(contentType) ret['Content-Type'] = contentType
      return this.token || contentType ? ret : {}
  }

  private callbackSuccess(callback: (success: boolean, status: number | null, data: any) => void): 
  (res: { data: any, statusCode: number }) => void {
    return (res: { data: any, statusCode: number }) => {
      if (res.statusCode === 401 && res.data && res.data.detail === 'Invalid token.') {
        this.setToken(null)
      }
      callback(res.statusCode < 400, res.statusCode, res.data)
    }
  }
  private callbackFailed(callback: (success: boolean, status: number | null, data: any) => void): () => void {
    return () => callback(false, null, null)
  }
  private generateMethodList(url: string): any {
    return (params: any, callback: (ok: boolean, status: number | null, data: any) => void) => wx.request({
      url: this.getURL(url), method: 'GET', header: this.getHeaders(),
      data: params,
      success: this.callbackSuccess(callback),
      fail: this.callbackFailed(callback)
    })
  }
  private generateMethodCreate(url: string): any {
    return (content: any, callback: (ok: boolean, status: number | null, data: any) => void) => wx.request({
      url: this.getURL(url), method: 'POST', header: this.getHeaders(),
      data: content,
      success: this.callbackSuccess(callback),
      fail: this.callbackFailed(callback)
    })
  }
  private generateMethodRetrieve(url: string): any {
    return (id: any, callback: (ok: boolean, status: number | null, data: any) => void) => wx.request({
      url: this.getDetailURL(url, id), method: 'GET', header: this.getHeaders(),
      success: this.callbackSuccess(callback),
      fail: this.callbackFailed(callback)
    })
  }
  private generateMethodUpdate(url: string): any {
    return (id: any, content: any, callback: (ok: boolean, status: number | null, data: any) => void) => wx.request({
      url: this.getDetailURL(url, id), method: 'PUT', header: this.getHeaders(),
      data: JSON.stringify(content),
      success: this.callbackSuccess(callback),
      fail: this.callbackFailed(callback)
    })
  }
  private generateMethodDelete(url: string): any {
    return (id: any, callback: (ok: boolean, status: number | null, data: any) => void) => wx.request({
      url: this.getDetailURL(url, id), method: 'DELETE', header: this.getHeaders(),
      success: this.callbackSuccess(callback),
      fail: this.callbackFailed(callback)
    })
  }
  private generateMethodGet(url: string): any {
    return (params: any, callback: (ok: boolean, status: number | null, data: any) => void) => wx.request({
      url: this.getURL(url), method: 'GET', header: this.getHeaders(),
      data: params,
      success: this.callbackSuccess(callback),
      fail: this.callbackFailed(callback)
    })
  }
  private generateMethodPost(url: string): any {
    return (content: any, callback: (ok: boolean, status: number | null, data: any) => void) => wx.request({
      url: this.getURL(url), method: 'POST', header: this.getHeaders(),
      data: content,
      success: this.callbackSuccess(callback),
      fail: this.callbackFailed(callback)
    })
  }
  private generateMethod(method: string, url: string): any {
      switch(method) {
        case 'list': return this.generateMethodList(url)
        case 'create': return this.generateMethodCreate(url)
        case 'retrieve': return this.generateMethodRetrieve(url)
        case 'update': return this.generateMethodUpdate(url)
        case 'delete': return this.generateMethodDelete(url)
        case 'get': return this.generateMethodGet(url)
        case 'post': return this.generateMethodPost(url)
        default: return null
      }
  }
  private endpoint(url: string, includes?: string[], extra_action?: any): Object {
      includes = includes || ['list', 'create', 'retrieve', 'update', 'partialUpdate', 'delete']
      let ret: any = {}
      if(extra_action) {
          for(let key in extra_action) {
              ret[key] = extra_action[key]
          }
      }
      for(let i of includes) {
          ret[i] = this.generateMethod(i, url)
      }
      return ret
  }
  private endpointImage(url: string): Object {
    return (formData: any, fileName: string, filePath: string, callback: (ok: boolean, status: number | null, data: any) => void) => wx.uploadFile({
      url: this.getURL(url),
      name: fileName,
      filePath,
      formData,
      header: this.getHeaders(),
      success: this.callbackSuccess(callback),
      fail: this.callbackFailed(callback)
    })
  }

  public auth: any = {
    login: this.endpoint('/auth/login', ['post']),
    logout: this.endpoint('/auth/logout', ['post']),
    token: this.endpoint('/auth/token', ['post']),
    info: this.endpoint('/auth/info', ['get'])
  }
  public student: any = {
    records: this.endpoint('/student/records', ['list', 'create', 'retrieve', 'update', 'delete']),
    images: this.endpoint('/student/images', ['list', 'retrieve'], {
      upload: this.endpointImage('/student/images')
    }),
    classes: this.endpoint('/student/classes', ['list', 'retrieve']),
    students: this.endpoint('/student/students', ['list', 'retrieve']),
    teachers: this.endpoint('/student/teachers', ['list', 'retrieve']),
  }
}

export {Client}