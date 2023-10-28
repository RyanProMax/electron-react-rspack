export enum Pages {
  Home = 'home.html',
  About = 'about.html',
}

export enum Channels {
  // main events
  Close = 'Close',
  Quit = 'Quit',
  Minimize = 'Minimize',
  Maximize = 'Maximize',
  GetPackageJson = 'GetPackageJson',
  OpenExternal = 'OpenExternal',
  Broadcast = 'Broadcast',
  ToggleTheme = 'ToggleTheme',

  // store
  GetUserStore = 'GetUserStore',
  SetUserStore = 'SetUserStore',

  // sub window
  AboutMe = 'AboutMe',
}
