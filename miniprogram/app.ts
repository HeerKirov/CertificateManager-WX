//app.ts
import {serverURL, prefix} from './config'
import {Client} from './utils/sdk'

export interface IMyApp {
  userInfoReadyCallback?(res: wx.UserInfo): void
  globalData: {
    serverURL: string,
    client: Client,
    profile: {
      username: string | null,
      userType: string | null,
      cardId: string | null,
      isStaff: boolean,
      isAuthenticated: boolean
    }
  }
}

App<IMyApp>({
  onLaunch() {

  },
  globalData: {
    serverURL,
    client: new Client({serverURL, tokenPrefix: prefix}),
    profile: {
      username: null,
      userType: null,
      cardId: null,
      isStaff: false,
      isAuthenticated: false
    }
  }
})