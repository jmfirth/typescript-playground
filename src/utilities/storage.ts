import * as lzs from 'lz-string';
import * as moment from 'moment';

const getStorageKey = (prefix: string, fragment: string) => `${prefix}${fragment}`;

type Serializable = any; // tslint:disable-line no-any

interface LocalStorageWrapper {
  expires: number;
  body: Serializable;
}

const createWrapper = (body: Serializable, expires: Date = moment().add(1, 'day').toDate()): LocalStorageWrapper => ({
  expires: expires.getTime(),
  body
});

const compress = (wrapper: LocalStorageWrapper) => lzs.compressToUTF16(JSON.stringify(wrapper));

const decompress = (compressed: string) =>
  JSON.parse(lzs.decompressFromUTF16(compressed)) as LocalStorageWrapper | undefined;

export const getStorageItem = (prefix: string, fragment: string) => {
  const compressed = localStorage.getItem(getStorageKey(prefix, fragment));
  if (compressed) {
    const item = decompress(compressed);
    if (item && moment(item.expires).isAfter(moment())) {
      return item.body;
    }
  }
  return;
};

export const setStorageItem = (prefix: string, fragment: string, body: Serializable, expires?: Date) =>
  localStorage.setItem(getStorageKey(prefix, fragment), compress(createWrapper(body, expires)));