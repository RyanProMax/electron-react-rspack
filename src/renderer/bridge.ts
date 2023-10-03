import log from 'electron-log';

class Bridge {
  private static instance?: Bridge;

  static getInstance() {
    if (this.instance === undefined) {
      this.instance = new Bridge();
    }
    return this.instance;
  }

  async call(channel: string, ...args: unknown[]) {
    log.info('[bridge] call', channel, args);
    const startTime = Date.now();

    

    log.info('[bridge] finish', channel, Date.now() - startTime);
  }
}

export const bridge = Bridge.getInstance();
