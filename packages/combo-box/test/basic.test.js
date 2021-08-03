import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { aTimeout, fixtureSync } from '@vaadin/testing-helpers';
import './vaadin-combo-box.js';

describe('properties', () => {
  let comboBox, input;

  beforeEach(() => {
    comboBox = fixtureSync('<vaadin-combo-box></vaadin-combo-box>');
    input = comboBox.inputElement;
  });

  describe('items property', () => {
    it('should have undefined by default', () => {
      expect(comboBox.items).to.be.undefined;
    });

    it('should be bound to items list', () => {
      comboBox.opened = true;
      comboBox.items = ['qux'];
      expect(comboBox.$.overlay._selector.items).to.eql(['qux']);
    });

    it('should update items list on mutation', () => {
      comboBox.opened = true;
      comboBox.items = [];
      comboBox.push('items', 'foo');
      expect(comboBox.$.overlay._selector._virtualCount).to.eql(1);
    });

    it('should set focused index on items set', () => {
      comboBox.value = 'bar';

      comboBox.items = ['foo', 'bar'];

      expect(comboBox._focusedIndex).to.eql(1);
    });

    it('should set focused index on mutation', () => {
      comboBox.value = 'baz';
      comboBox.items = ['foo', 'bar'];

      comboBox.push('items', 'baz');

      expect(comboBox._focusedIndex).to.eql(2);
    });

    it('should support resetting items', () => {
      comboBox.items = ['foo', 'bar'];
      comboBox.items = undefined;
      comboBox.opened = true;
      expect(comboBox.$.overlay._selector._virtualCount).to.eql(0);
    });
  });

  // TODO: these tests are here to prevent possible regressions with using
  // the internal properties of iron-list. These can be removed after this
  // logic no longer is implemented in vaadin-combo-box.
  describe('visible item count', () => {
    it('should calculate items correctly when all items are visible', async () => {
      comboBox.items = ['foo', 'bar', 'baz', 'qux'];
      comboBox.open();
      await aTimeout(0);
      expect(comboBox.$.overlay._visibleItemsCount()).to.eql(4);
      expect(comboBox.$.overlay._selector.lastVisibleIndex).to.eql(3);
    });

    it('should calculate items correctly when some items are hidden', async () => {
      const items = [];
      for (let i = 0; i < 100; i++) {
        items.push(i.toString());
      }

      comboBox.items = items;
      comboBox.open();
      await aTimeout(0);
      expect(comboBox.$.overlay._visibleItemsCount()).to.eql(comboBox.$.overlay._selector.lastVisibleIndex + 1);
    });
  });

  describe('value property', () => {
    it('should have empty string by default', () => {
      expect(comboBox.value).to.eql('');
    });

    it('should be able to be set before items', () => {
      comboBox.value = 'foo';

      comboBox.items = ['foo', 'bar'];

      expect(comboBox.selectedItem).to.eql('foo');
      expect(input.value).to.eql('foo');
    });

    it('should be able to be set before object items', () => {
      const item = { label: 'foo', value: 1 };
      comboBox.value = 1;

      comboBox.items = [item];

      expect(comboBox.selectedItem).to.eql(item);
      expect(input.value).to.eql('foo');
    });

    it('should be empty string when setting invalid value multiple times', () => {
      const spy = sinon.spy(comboBox, '_selectedItemChanged');
      comboBox.items = [];
      expect(spy.callCount).to.eql(0);

      comboBox.value = 1;
      expect(comboBox.value).to.eql('');
      expect(spy.callCount).to.eql(1);

      comboBox.value = 2;
      expect(comboBox.value).to.eql('');
      expect(spy.callCount).to.eql(2);

      comboBox.items = ['foo'];
      comboBox.value = 'foo';
      expect(comboBox.value).to.eql('foo');
      expect(spy.callCount).to.eql(3);
    });
  });

  describe('pattern property', () => {
    beforeEach(() => {
      comboBox.allowCustomValue = true;
    });

    it('should work with the allowed pattern', () => {
      comboBox.pattern = '[0-9]*';
      comboBox.value = 'foo';
      expect(comboBox.validate()).to.be.false;
    });

    it('should support preventInvalidInput property', () => {
      comboBox.pattern = '[0-9]*';
      comboBox.preventInvalidInput = true;
      input.value = 'foo';
      input.dispatchEvent(new CustomEvent('input'));
      expect(comboBox.value).to.equal('');
    });
  });

  describe('has-value attribute', () => {
    it('should be updated when setting the value', () => {
      comboBox.value = 'foo';
      expect(comboBox.hasAttribute('has-value')).to.be.true;
    });
  });

  describe('allowCustomValue property', () => {
    beforeEach(() => {
      comboBox.items = [];
      comboBox.allowCustomValue = true;
    });

    it('should set bind value after setting value property', () => {
      comboBox.value = 'foo';

      expect(input.value).to.eql('foo');
    });

    it('should set value after setting a custom input value', () => {
      comboBox.open();
      input.value = 'foo';
      input.dispatchEvent(new CustomEvent('input'));
      comboBox.close();

      expect(comboBox.value).to.eql('foo');
    });

    it('should keep custom value after entering label matching to an item, blurring that item and closing overlay', () => {
      comboBox.items = ['a', 'b'];

      comboBox.open();
      input.value = 'foo';
      input.dispatchEvent(new CustomEvent('input'));
      comboBox.close();

      comboBox.open();
      input.value = 'a';
      input.dispatchEvent(new CustomEvent('input'));
      comboBox._focusedIndex = -1;
      comboBox.close();

      expect(comboBox.value).to.eql('foo');
      expect(input.value).to.eql('foo');
    });

    describe('custom-value-set event', () => {
      beforeEach(() => (comboBox.items = ['a', 'b']));

      it('should be fired when custom value is set', () => {
        const spy = sinon.spy();
        comboBox.addEventListener('custom-value-set', spy);

        comboBox.open();
        input.value = 'foo';
        input.dispatchEvent(new CustomEvent('input'));
        comboBox.close();

        expect(spy.callCount).to.eql(1);
      });

      it('should not be fired when custom values are not allowed', () => {
        comboBox.allowCustomValue = false;

        const spy = sinon.spy();
        comboBox.addEventListener('custom-value-set', spy);

        comboBox.open();
        input.value = 'foo';
        input.dispatchEvent(new CustomEvent('input'));
        comboBox.close();

        expect(spy.callCount).to.eql(0);
      });

      it('should be cancelable', () => {
        comboBox.addEventListener('custom-value-set', (e) => e.preventDefault());

        comboBox.open();
        input.value = 'foo';
        input.dispatchEvent(new CustomEvent('input'));
        comboBox.close();
        expect(comboBox.value).to.be.empty;
      });

      it('should not be fired when clicking an item', () => {
        const spy = sinon.spy();
        comboBox.addEventListener('custom-value-set', spy);

        comboBox.open();
        input.value = 'a';
        comboBox.$.overlay._selector.querySelector('vaadin-combo-box-item').click();
        expect(spy.called).to.be.false;
      });

      it('should not be fired when existing item is entered and overlay is closed', () => {
        const spy = sinon.spy();
        comboBox.addEventListener('custom-value-set', spy);

        comboBox.open();
        input.value = 'a';
        comboBox.close();
        input.blur();
        expect(spy.called).to.be.false;
      });
    });
  });

  describe('label property', () => {
    it('should have empty label by default', () => {
      expect(comboBox.label).to.be.equal('');
    });

    it('should be set label element text content', () => {
      comboBox.label = 'Label';
      expect(comboBox.querySelector('[slot="label"]').textContent).to.eql('Label');
    });
  });

  describe('selectedItem property', () => {
    beforeEach(() => {
      comboBox.items = ['foo'];
    });

    it('should have null by default', () => {
      expect(comboBox.selectedItem).to.be.undefined;
    });

    it('should set value and input', () => {
      comboBox.selectedItem = 'foo';

      expect(comboBox.value).to.eql('foo');
      expect(input.value).to.eql('foo');
    });

    it('should default back to null when value set to undefined', () => {
      comboBox.value = 'foo';

      comboBox.value = undefined;

      expect(comboBox.selectedItem).to.be.null;
    });

    it('should default back to null when value is set to null', () => {
      comboBox.value = null;

      expect(comboBox.selectedItem).to.be.null;
    });

    it('should be null after clearing the value', () => {
      comboBox.value = 'foo';

      comboBox._clear();

      expect(comboBox.selectedItem).to.be.null;
    });

    it('should not open the overlay after clearing the value', () => {
      comboBox.open();
      comboBox.close();

      const overlayElement = comboBox.$.overlay.$.dropdown.$.overlay;
      comboBox.value = 'foo';

      comboBox._clear();

      expect(overlayElement.opened).not.to.be.true;
    });
  });

  describe('focus API', () => {
    it('should not be focused by default', () => {
      expect(comboBox.hasAttribute('focused')).to.be.false;
    });

    it('should not throw on focusout', () => {
      expect(() => comboBox.dispatchEvent(new Event('focusout'))).not.to.throw(Error);
    });

    it('should focus the input with focus method', () => {
      comboBox.focus();

      expect(comboBox.hasAttribute('focused')).to.be.true;
    });

    it('should blur the input with the blur method', () => {
      comboBox.focus();
      comboBox.blur();

      expect(comboBox.hasAttribute('focused')).to.be.false;
    });

    describe('touch devices', () => {
      beforeEach(() => {
        comboBox.open();
        comboBox.close();
      });

      it('should blur the input on touchend', () => {
        comboBox.focus();

        const spy = sinon.spy(input, 'blur');
        comboBox.$.overlay.$.dropdown.$.overlay.dispatchEvent(new CustomEvent('touchend'));
        expect(spy.callCount).to.eql(1);
      });

      it('should blur the input on touchmove', () => {
        comboBox.focus();

        const spy = sinon.spy(input, 'blur');
        comboBox.$.overlay.$.dropdown.$.overlay.dispatchEvent(new CustomEvent('touchmove'));
        expect(spy.callCount).to.eql(1);
      });

      it('should not blur the input on touchstart', () => {
        comboBox.focus();

        const spy = sinon.spy(input, 'blur');
        comboBox.$.overlay.$.dropdown.$.overlay.dispatchEvent(new CustomEvent('touchstart'));
        expect(spy.callCount).to.eql(0);
      });
    });
  });

  describe('clear button', () => {
    it('should not have clear-button-visible by default', () => {
      expect(comboBox.clearButtonVisible).to.equal(false);
    });
  });

  describe('dir attribute', () => {
    it('should preserve and propagate dir to the dropdown overlay', () => {
      comboBox.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('dir', 'rtl');
      comboBox.items = ['foo', 'bar'];
      comboBox.open();
      expect(comboBox.$.overlay.$.dropdown.$.overlay.getAttribute('dir')).to.eql('ltr');
      document.documentElement.removeAttribute('dir');
    });
  });
});

describe('inside flexbox', () => {
  let container;

  beforeEach(() => {
    container = fixtureSync(`
      <div style="display: flex; flex-direction: column; width:500px;">
        <vaadin-combo-box></vaadin-combo-box>
      </div>
    `);
  });

  it('combo-box should stretch to fit the flex container', () => {
    const combobox = container.querySelector('vaadin-combo-box');
    expect(window.getComputedStyle(container).width).to.eql('500px');
    expect(window.getComputedStyle(combobox).width).to.eql('500px');
  });
});

describe('slots', () => {
  let comboBox;

  beforeEach(() => {
    comboBox = fixtureSync(`
      <vaadin-combo-box>
        <div slot="prefix">foo</div>
        <div slot="helper">bar</div>
      </vaadin-combo-box>
    `);
  });

  it('should expose the prefix slot', () => {
    const slot = comboBox.shadowRoot.querySelector('slot[name="prefix"]');
    expect(slot.assignedNodes()[0].textContent).to.eql('foo');
  });

  it('should expose the helper slot', () => {
    const slot = comboBox.shadowRoot.querySelector('slot[name="helper"]');
    expect(slot.assignedNodes()[0].textContent).to.eql('bar');
  });
});

describe('theme attribute', () => {
  let comboBox;

  beforeEach(() => {
    comboBox = fixtureSync('<vaadin-combo-box theme="foo"></vaadin-combo-box>');
  });

  it('should propagate theme attribute to input container', () => {
    const inputField = comboBox.shadowRoot.querySelector('[part="input-field"]');
    expect(inputField.getAttribute('theme')).to.equal('foo');
  });

  it('should propagate theme attribute to overlay', () => {
    comboBox.open();
    comboBox.close();

    expect(comboBox.$.overlay.$.dropdown.$.overlay.getAttribute('theme')).to.equal('foo');
  });

  it('should propagate theme attribute to item', () => {
    comboBox.items = ['bar', 'baz'];
    comboBox.open();
    expect(comboBox.$.overlay._selector.querySelector('vaadin-combo-box-item').getAttribute('theme')).to.equal('foo');
  });
});

describe('clear-button-visible', () => {
  let comboBox, clearButton;

  beforeEach(() => {
    comboBox = fixtureSync('<vaadin-combo-box clear-button-visible></vaadin-combo-box>');
    clearButton = comboBox.$.clearButton;
  });

  it('should propagate clear-button-visible attribute to text-field', () => {
    expect(comboBox.clearButtonVisible).to.be.true;
  });

  it('clear button should be hidden when disabled', () => {
    comboBox.disabled = true;
    expect(getComputedStyle(clearButton).display).to.equal('none');
  });

  it('clear button should be hidden when read-only', () => {
    comboBox.readonly = true;
    expect(getComputedStyle(clearButton).display).to.equal('none');
  });
});
