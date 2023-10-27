export enum Pages {
  Home = 'home.html',
  Sub = 'sub.html',
}

export enum Channels {
  // main events
  Quit = 'Quit',
  GetPackageJson = 'GetPackageJson',
  OpenExternal = 'OpenExternal',
  Broadcast = 'Broadcast',

  // store
  GetUserStore = 'GetUserStore',
  SetUserStore = 'SetUserStore',

  // sub window
  CreateSubWindow = 'CreateSubWindow',
}
