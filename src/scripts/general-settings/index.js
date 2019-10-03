/* global $, swal */

const { ipcRenderer, remote } = require('electron');

const renderSidebar = require('./modules/sidebar');
const renderPricing = require('./modules/pricing');
const renderBalances = require('./modules/balances');
const renderLocalization = require('./modules/localization');
const renderLayout = require('./modules/layout');

const handleError = err => {
  console.error(err);
  alert(err);
};

const state = {

  _data: new Map(),

  set(key, val) {
    this._data.set(key, val);
    // console.log('state', [...this._data.entries()]
    //   .reduce((obj, [ k, v ]) => Object.assign(obj, {[k]: v}), {})
    // );
  },

  get(key) {
    return this._data.get(key);
  }

};

state.set('locale', ipcRenderer.sendSync('getUserLocale'));
state.set('locales', [
  ['en', 'English']
  // ['de', 'Deutsch']
]);
state.set('active', 0);
state.set('sidebarSelected', 0);
state.set('sidebarItems', [
  {sidebarText: 'Market Pricing', title: 'MARKET PRICING'},
  {sidebarText: 'Balances', title: 'BALANCES'},
  {sidebarText: 'Language', title: 'LANGUAGE'}
  // {sidebarText: 'Layout Options', title: 'LAYOUT OPTIONS'}
]);

state.set('pricingUnits', [
  'BTC'
]);
state.set('pricingSources', [
  {id: 'CRYPTO_COMPARE', text: 'CryptoCompare', apiKeyNeeded: false},
  {id: 'COIN_MARKET_CAP', text: 'CoinMarketCap', apiKeyNeeded: true}
]);

const saveSettings = () => {
  ipcRenderer.send('saveGeneralSettings', {
    pricingEnabled: state.get('pricingEnabled'),
    pricingSource: state.get('pricingSource'),
    apiKeys: state.get('apiKeys'),
    pricingUnit: state.get('pricingUnit'),
    pricingFrequency: state.get('pricingFrequency'),
    showWallet: state.get('showWallet')
  });
};

$(document).ready(() => {

  const closeDropdowns = () => {
    const $target = $('#js-mainConfigurationArea');
    const $icons = $target.find('i.fa-angle-up');
    $target.find('.js-dropdownMenu').remove();
    $icons
      .addClass('fa-angle-down')
      .removeClass('fa-angle-up');
  };

  const apiKeyError = (bool) => {
    const msg = bool ? "Error: an API key is required for this data source." : "&nbsp;";
    $('#js-pricingInputError').html(msg);
    bool ? $('#js-apiKeyInput').addClass('pricingInputError') : $('#js-apiKeyInput').removeClass('pricingInputError');
  }

  const render = () => {

    const sidebarItems = state.get('sidebarItems');
    const sidebarSelected = state.get('sidebarSelected');
    const active = state.get('active');
    const sidebarHTML = renderSidebar({ state });
    let mainHTML = '';
    switch(active) {
      case 0:
        mainHTML = renderPricing({ state });
        break;
      case 1:
        mainHTML = renderBalances({ state });
        break;
      case 2:
        mainHTML = renderLocalization({ state });
        break;
      default:
        mainHTML = '';
    }

    const html = `
          <div class="container">
            <div class="flex-container">
              <div class="col1">
                ${sidebarHTML}
              </div>
              <div class="col2">
                <h3 class="title">${sidebarItems[sidebarSelected]['title']}</h3>
                ${mainHTML}
              </div>
            </div>
          </div>
        `;

    $('#js-main').html(html);

    setTimeout(() => {

      $('#js-main')
        .off('click')
        .on('click', e => {
          e.preventDefault();
          const $target = $(e.target);
          if(!$target.hasClass('js-dropdownButton') && !$target.parent().hasClass('js-dropdownButton') && !$target.parent().parent().hasClass('js-dropdownButton')) {
            closeDropdowns();
          }
        });

      $('.js-sidebarItem')
        .off('click')
        .on('click', e => {
          e.preventDefault();
          const newActive = Number($(e.target).attr('data-sidebar-index'));
          state.set('active', newActive);
          state.set('sidebarSelected', newActive);
          render();

          // if ($('#js-apiKeyInput').val() !== undefined) {
          //   let pricingSource = state.get('pricingSource');
          //   let pricingSources = state.get('pricingSources');
          //   let pricingSourceObj = pricingSources.find(p => p.id === pricingSource);
          //   apiKeyError(false);
          //   if(!pricingSourceObj.apiKeyNeeded) {
          //     $('#js-apiKeyInput').prop("disabled", true);
          //     $('#js-apiKeyInput').attr("placeholder", "API key not needed").val('');
          //   } else {
          //     $('#js-apiKeyInput').prop("disabled", false);
          //     $('#js-apiKeyInput').attr("placeholder", "Enter API key");
          //     if (pricingSourceObj.apiKeyNeeded && $('#js-apiKeyInput').val().trim() == '') {
          //       $('#js-apiKeyInput').val('');
          //       apiKeyError(true);
          //     }
          //   }
          // }

      });

      $('#js-pricingUnitDropdown')
        .off('click')
        .on('click', e => {
          e.preventDefault();
          const $target = $(e.currentTarget);
          const $icon = $target.find('i');
          const pricingUnits = state.get('pricingUnits');
          const height = $target.outerHeight();
          const width = $target.outerWidth();
          if($icon.hasClass('fa-angle-up')) {
            closeDropdowns();
            return;
          }
          $icon.addClass('fa-angle-up');
          $icon.removeClass('fa-angle-down');
          $target.append(`
            <div class="js-dropdownMenu" style="z-index:1000;position:absolute;top:${height}px;left:0;background-color:#ddd;width:${width}px;max-height:162px;overflow-y:auto;">
              ${[...pricingUnits].sort((a, b) => a.localeCompare(b)).map(u => `<div class="js-dropdownMenuItem dropdown-button" data-unit="${u}"><div>${u}</div></div>`).join('')}
            </div>
          `);
          setTimeout(() => {
            $('.js-dropdownMenuItem')
              .off('click')
              .on('click', e => {
                e.preventDefault();
                const unit = $(e.currentTarget).attr('data-unit');
                $($target.find('div')[0]).text(unit);
                state.set('pricingUnit', unit);
                saveSettings();
              });
          }, 0);
        });
      $('#js-pricingSourceDropdown')
        .off('click')
        .on('click', e => {
          e.preventDefault();
          const $target = $(e.currentTarget);
          const $icon = $target.find('i');
          const pricingSources = state.get('pricingSources');
          const height = $target.outerHeight();
          const width = $target.outerWidth();
          if($icon.hasClass('fa-angle-up')) {
            closeDropdowns();
            return;
          }
          $icon.addClass('fa-angle-up');
          $icon.removeClass('fa-angle-down');
          $target.append(`
            <div class="js-dropdownMenu" style="z-index:1000;position:absolute;top:${height}px;left:0;background-color:#ddd;width:${width}px;max-height:162px;overflow-y:auto;">
              ${[...pricingSources].map(s => `<div class="js-dropdownMenuItem dropdown-button" data-source="${s.id}"><div>${s.text}</div></div>`).join('')}
            </div>
          `);
          setTimeout(() => {
            $('.js-dropdownMenuItem')
              .off('click')
              .on('click', ee => {
                ee.preventDefault();
                const source = $(ee.currentTarget).attr('data-source');
                const pricingSourceObj = pricingSources.find(p => p.id === source);
                const $toggle1 = $('.js-pricingToggle1');
                const $toggle2 = $('.js-pricingToggle2');
                const $colorBar = $('.js-pricingColorBar');
                $($target.find('div')[0]).text(pricingSourceObj.text);
                state.set('pricingSource', source);
                $('#js-apiKeyInput').attr("placeholder", "Enter API key");
                const apiKeys = state.get('apiKeys');
                let key;
                if(apiKeys[source]) {
                  key = apiKeys[source];
                } else {
                  key = '';
                  const newAPIKeys = Object.assign({}, apiKeys, {
                    [source]: key
                  });
                  state.set('apiKeys', newAPIKeys);
                }
                $('#js-apiKeyInput').val(key);
                if(!pricingSourceObj.apiKeyNeeded) {
                  // api key not needed
                  $('#js-apiKeyInput').prop("disabled", true);
                  $('#js-apiKeyInput').attr("placeholder", "API key not needed").val('');
                  apiKeyError(false);
                } else {
                  // api key needed
                  $('#js-apiKeyInput').prop("disabled", false);
                  if (pricingSourceObj.apiKeyNeeded && $('#js-apiKeyInput').val().trim() == '') {
                    $('#js-apiKeyInput').val('');
                    apiKeyError(true);
                    state.set('pricingEnabled', false);
                    $toggle2.addClass('active');
                    $toggle1.removeClass('active');
                    $colorBar.addClass('color-bar-right');
                    $colorBar.removeClass('color-bar-left');
                  }
                }
                saveSettings();
              });
          }, 0);
        });
      $('.js-pricingColorToggle')
        .off('click')
        .on('click', e => {
          e.preventDefault();
          const pricingSource = state.get('pricingSource');
          const pricingSources = state.get('pricingSources');
          const pricingSourceObj = pricingSources.find(p => p.id === pricingSource);
          const $target = $(e.currentTarget);
          const $toggle1 = $target.find('.js-pricingToggle1');
          const $toggle2 = $target.find('.js-pricingToggle2');
          const $colorBar = $target.find('.js-pricingColorBar');
          if($toggle1.hasClass('active')) {
            state.set('pricingEnabled', false);
            $toggle2.addClass('active');
            $toggle1.removeClass('active');
            $colorBar.addClass('color-bar-right');
            $colorBar.removeClass('color-bar-left');
          } else {
            if ( pricingSourceObj.apiKeyNeeded && $('#js-apiKeyInput').val().trim() == '') {
              // api key needed, keep disabled
              // console.log('make disabled');
              $('#js-apiKeyInput').val('');
              apiKeyError(true);
              state.set('pricingEnabled', false);
              $toggle2.addClass('active');
              $toggle1.removeClass('active');
              $colorBar.addClass('color-bar-right');
              $colorBar.removeClass('color-bar-left');
            } else {
              // console.log('make enabled');
              apiKeyError(false);
              state.set('pricingEnabled', true);
              $toggle1.addClass('active');
              $toggle2.removeClass('active');
              $colorBar.addClass('color-bar-left');
              $colorBar.removeClass('color-bar-right');
            }
          }
          saveSettings();
        });

      $('#js-apiKeyInput')
        .off('change')
        .on('change', e => {
          e.preventDefault();
          const { value } = e.target;
          const pricingSource = state.get('pricingSource');
          const pricingSources = state.get('pricingSources');
          const pricingSourceObj = pricingSources.find(p => p.id === pricingSource);
          const apiKeys = state.get('apiKeys');
          const newAPIKeys = Object.assign({}, apiKeys, {
            [pricingSource]: value.trim()
          });
          state.set('apiKeys', newAPIKeys);
          const $toggle1 = $('.js-pricingToggle1');
          const $toggle2 = $('.js-pricingToggle2');
          const $colorBar = $('.js-pricingColorBar');
          if (pricingSourceObj.apiKeyNeeded && $('#js-apiKeyInput').val().trim() == '') {
            $('#js-apiKeyInput').val('');
            apiKeyError(true);
            state.set('pricingEnabled', false);
            $toggle2.addClass('active');
            $toggle1.removeClass('active');
            $colorBar.addClass('color-bar-right');
            $colorBar.removeClass('color-bar-left');
          } else {
            let sanitized = $('#js-apiKeyInput').val().trim();
            $('#js-apiKeyInput').val(sanitized);
            apiKeyError(false);
          }
          saveSettings();
        });

      $('#js-updateFrequencyInput')
        .off('change')
        .on('change', e => {
          e.preventDefault();
          const { value } = e.target;
          // console.log('value', value);
          const preppedValue = Number(value) * 1000;
          state.set('pricingFrequency', preppedValue);
          saveSettings();
        });

      $('#js-showWalletDropdown')
        .off('click')
        .on('click', e => {
          e.preventDefault();
          const $target = $(e.currentTarget);
          const $icon = $target.find('i');
          const showWallet = state.get('showWallet');
          const height = $target.outerHeight();
          const width = $target.outerWidth();
          if ($icon.hasClass('fa-angle-up')) {
            closeDropdowns();
            return;
          }
          $icon.addClass('fa-angle-up');
          $icon.removeClass('fa-angle-down');
          $target.append(`
            <div class="js-dropdownMenu" style="z-index:1000;position:absolute;top:${height}px;left:0;background-color:#ddd;width:${width}px;max-height:162px;overflow-y:auto;">
              <div class="js-dropdownMenuItem dropdown-button" data-showWallet="true"><div>Yes</div></div>
              <div class="js-dropdownMenuItem dropdown-button" data-showWallet="false"><div>No</div></div>
            </div>
          `);
          setTimeout(() => {
            $('.js-dropdownMenuItem')
              .off('click')
              .on('click', ee => {
                ee.preventDefault();
                const value = $(ee.currentTarget).attr('data-showWallet');
                // console.log('value', value, typeof value);
                const newShowWallet = value === 'true' ? true : false;
                // console.log('newShowWallet', newShowWallet);
                $($target.find('div')[0]).text(newShowWallet ? 'Yes' : 'No');
                state.set('showWallet', newShowWallet);
                saveSettings();
              });
          }, 0);
        });

      $('#js-selectLocaleDropdown')
        .off('click')
        .on('click', e => {
          e.preventDefault();
          const $target = $(e.currentTarget);
          const $icon = $target.find('i');
          const height = $target.outerHeight();
          const width = $target.outerWidth();
          const locales = state.get('locales');
          if ($icon.hasClass('fa-angle-up')) {
            closeDropdowns();
            return;
          }
          $icon.addClass('fa-angle-up');
          $icon.removeClass('fa-angle-down');
          $target.append(`
            <div class="js-dropdownMenu" style="z-index:1000;position:absolute;top:${height}px;left:0;background-color:#ddd;width:${width}px;max-height:162px;overflow-y:auto;">
              ${locales.map(([code, name]) => `<div class="js-dropdownMenuItem dropdown-button" data-locale="${code}"><div>${code} - ${name}</div></div>`).join('')}
            </div>
          `);
          setTimeout(() => {
            $('.js-dropdownMenuItem')
              .off('click')
              .on('click', async function(ee) {
                ee.preventDefault();
                const value = $(ee.currentTarget).attr('data-locale');
                const selected = locales.find(([code]) => code === value);
                const confirmed = await remote.dialog.showMessageBox({
                  type: 'warning',
                  message: `In order to change the language to ${selected[1]}, Block DX must restart. Do you want to continue?`,
                  buttons: [
                    'Cancel',
                    'OK'
                  ]
                });
                if(!confirmed) return;
                $($target.find('div')[0]).text(selected[0] + ' - ' + selected[1]);
                state.set('locale', value);
                ipcRenderer.send('setUserLocale', value);
              });
          }, 0);
        });

        }, 0);
  };

  (async function() {
    try {
      let pricingEnabled = ipcRenderer.sendSync('getPricingEnabled');
      state.set('pricingEnabled', pricingEnabled);
      let pricingSource = ipcRenderer.sendSync('getPricingSource');
      state.set('pricingSource', pricingSource);
      let apiKeys = ipcRenderer.sendSync('getAPIKeys');
      state.set('apiKeys', apiKeys);
      let pricingUnit = ipcRenderer.sendSync('getPricingUnit');
      state.set('pricingUnit', pricingUnit);
      let pricingFrequency = ipcRenderer.sendSync('getPricingFrequency');
      state.set('pricingFrequency', pricingFrequency);
      const showWallet = ipcRenderer.sendSync('getShowWallet');
      state.set('showWallet', showWallet);

      render();

      let pricingSources = state.get('pricingSources');
      let pricingSourceObj = pricingSources.find(p => p.id === pricingSource);
      apiKeyError(false);
      if(!pricingSourceObj.apiKeyNeeded) {
        $('#js-apiKeyInput').prop("disabled", true);
        $('#js-apiKeyInput').attr("placeholder", "API key not needed").val('');
      } else {
        $('#js-apiKeyInput').prop("disabled", false);
        $('#js-apiKeyInput').attr("placeholder", "Enter API key");
        if (pricingSourceObj.apiKeyNeeded && $('#js-apiKeyInput').val().trim() == '') {
          $('#js-apiKeyInput').val('');
          apiKeyError(true);
        }
      }

    } catch(err) {
      handleError(err);
    }
  })();
});
