/*
8f3917ddc035fc9b2753b21188348581
POST https://pastebin.com/api/api_post.php

1. api_dev_key - which is your unique API Developers Key.
2. api_option - set as 'paste', this will indicate you want to create a new paste.
3. api_paste_code - this is the text that will be written inside your paste.

api_paste_private = 0
api_paste_expire_date = 10M
api_paste_format = ecmascript
*/

// const devKey = '8f3917ddc035fc9b2753b21188348581';
// const createPasteUrl: string = 'https://pastebin.com/api/api_post.php';
// const loginUrl: string = 'https://pastebin.com/api/api_login.php';

/*
export async function login() {
  try {
    const options = {
      'api_dev_key': devKey,
      'api_user_name': 'typescriptplayground',
      'api_user_password': 'typescriptplayground1'
    };
    const body = Object.keys(options).map(key => `${key}=${options[key]}`).join('&');
    const res = await fetch(loginUrl,
    { method: 'POST', mode: 'no-cors', body, headers: { 'content-type': 'application/x-www-form-urlencoded' } });
    const text = await res.text();
    console.log(text);
    debugger;
  } catch (e) {

  }
}

export async function createPaste(code: string) {
  try {
    const options = {
      'api_option': 'paste',
      'api_dev_key': devKey,
      'api_paste_code': encodeURIComponent(code),
      'api_paste_private': 0,
      'api_paste_format': 'ecmascript',
      'api_paste_expire_date': '10M',
    };
    const body = Object.keys(options).map(key => `${key}=${options[key]}`).join('&');
    // await login();
    // const res = await fetch(createPasteUrl,
    { method: 'POST', mode: 'no-cors', body, headers: { 'content-type': 'application/x-www-form-urlencoded' } });
    // const text = await res.text();
    fetch(createPasteUrl,
    { method: 'POST', mode: 'cors', body, headers: { 'content-type': 'application/x-www-form-urlencoded' } })
      .then(res => res.arrayBuffer())
      .then(blob => { debugger; });
  } catch (e) {
    debugger;
  }
}
*/

// BTLF4o5GjQQRjN8NwLPWcAFSn+zppcg6

/*
export async function createPaste(code: string) {
  try {
    const post = {
      Title: 'Sample title',
      Content: 'Post body content...',
      Type: 'public',
    };

    const headers = new Headers();
    headers.set('content-type', 'application/json');
    headers.set('X-TextUploader-API-Key', 'BTLF4o5GjQQRjN8NwLPWcAFSn+zppcg6');
    // const body = Object.keys(options).map(key => `${key}=${options[key]}`).join('&');
    const res = await fetch('http://api.textuploader.com/v1/posts', {
      method: 'POST',
      mode: 'no-cors',
      headers: headers,
      body: JSON.stringify(post),
    });
    const json = await res.json();
    console.log(json);
    debugger;
  } catch(e) {
    debugger;
  }
}
*/

/*
export async function createPaste(code: string) {
  try {
    const options = {
      sections: [
        { name: 'test', contents: code, syntax: 'ts' }
      ]
    }
    const headers = new Headers();
    headers.set('content-type', 'application/json');
    headers.set('X-Auth-Token', 'uLwRL3onoEM3AAqxPrMG9GQHtQEDWVk4csgpj4ald');
    // const body = Object.keys(options).map(key => `${key}=${options[key]}`).join('&');
    const res = await fetch('https://api.paste.ee/v1/pastes', {
      method: 'POST',
      mode: 'no-cors',
      credentials: 'include',
      headers: headers,
      body: JSON.stringify(options),
    });
    const json = await res.json();
    console.log(json);
    debugger;
  } catch(e) {
    debugger;
  }
}
*/
