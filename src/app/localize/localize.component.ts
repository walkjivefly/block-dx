// tslint:disable:component-selector
// tslint:disable:component-class-suffix

import {Component, ContentChild, Input} from '@angular/core';
import escapeRegExp from 'lodash/escapeRegExp';

let localeData = {
  Balaces: {
    mainview: {
      val: 'Balances'
    }
  }
};
const backupLocale = 'en';
let selectedLocale;
let debugging;
let collator;
let decimalSeparator;
let groupingSeparator;

@Component({
  selector: 'Localize',
  template: '{{val}}'
})
export class Localize {

  @Input() context: string;
  @Input() key: string;
  @Input() replacers: object;

  static initialize(locale: string, data: any, debug = false) {
    selectedLocale = locale;
    localeData = data;
    collator = new Intl.Collator(locale);
    debugging = debug;
    decimalSeparator = (1.2).toLocaleString([locale, backupLocale]).match(/\D/)[0];
    groupingSeparator = (1000000).toLocaleString([locale, backupLocale]).match(/\D/)[0];
    console.log(locale, decimalSeparator, groupingSeparator);
  }

  static locale() {
    return selectedLocale;
  }

  static text(key, context, replacers = {}) {
    let text = localeData[key] && localeData[key][context] ? localeData[key][context].val : key;
    const replacerKeys = Object.keys(replacers);
    if(replacerKeys.length > 0) {
      for(const replacer of Object.keys(replacers)) {
        const val = replacers[replacer];
        const patt = new RegExp(escapeRegExp('{' + replacer + '}'), 'g');
        text = text.replace(patt, val);
      }
    }
    if(debugging) {
      return '***' + text + '***';
    } else {
      return text;
    }
  }

  static number(num) {
    return num.toLocaleString([selectedLocale, backupLocale]);
  }

  static compare(a, b) {
    return collator.compare(a, b);
  }

  static decimalSeparator() {
    return decimalSeparator;
  }

  static groupingSeparator() {
    return groupingSeparator;
  }

  get val() {
    const { key, context, replacers } = this;
    return Localize.text(key, context, replacers);
  }

}
