const { dropdown } = require('./shared');

const showLocaleOption = ({ state }) => {
  const locale = state.get('locale');
  const locales = state.get('locales');
  const [ code, name ] = locales.find(l => l[0] === locale);
  return `
    <div class="option-container">
      <p class="option-title"></p>
      <p class="option-description">This will change the language of the Block DX application. Please select one of the available locales.</p>
      ${dropdown({ id: 'js-selectLocaleDropdown', label: 'Select App Locale', value: code + ' - ' + name })}
    </div>
  `;
};

const renderLocalization = ({ state }) => {
  const html = `
    <div id="js-mainConfigurationArea" class="main-area">
      ${showLocaleOption({ state })}
    </div>
  `;
  return html;
};

module.exports = renderLocalization;
