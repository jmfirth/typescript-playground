import * as moment from 'moment';
import * as storage from './storage';
import * as location from './location';

const LOCAL_STORAGE_PREFIX = 'tspg-app-';
const ACCESS_TOKEN = 'accessToken';

let accessToken = storage.getStorageItem(LOCAL_STORAGE_PREFIX, ACCESS_TOKEN);

const CLIENT_ID = '0138dec573cf22322bb3';

const REDIRECT_URI = `${window.location.origin}${window.location.pathname}`;

const SCOPES = 'user:email,gist';

export const GITHUB_OAUTH_URL =
  `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${SCOPES}`;

export function checkAuthentication() {
  return !!accessToken;
}

export async function maybeAuthenticate() {
  const code = location.getQueryStringParameter('code');
  if (code) {
    accessToken = await getAccessToken(code);
    if (accessToken) {
      const expires = moment().add(14, 'days').toDate();
      storage.setStorageItem(LOCAL_STORAGE_PREFIX, ACCESS_TOKEN, accessToken, expires);
      // tslint:disable-next-line no-console
      console.info('Github authentication successful.', accessToken);
      return true;
    } else {
      alert('Github authentication failed');
    }
  }
  return false;
}

async function getAccessToken(code: string) {
  try {
    const res = await fetch(`https://gatekeeper.abstractsequential.com/authenticate/${code}`);
    const json = await res.json();
    accessToken = json.token as string;
  } catch (e) {
    accessToken = '';
    alert('Error authenticating with Github');
    return;
  }
}