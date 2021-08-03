import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import {
  aTimeout,
  fixtureSync,
  focusout,
  keyDownOn,
  arrowDownKeyDown,
  arrowUpKeyDown,
  enterKeyDown,
  escKeyDown,
  fire,
  isDesktopSafari
} from '@vaadin/testing-helpers';
import { onceScrolled } from './helpers.js';
import './vaadin-combo-box.js';

describe('keyboard', () => {
  let comboBox, input;

  function filter(value) {
    input.value = value;
    fire(input, 'input');
  }

  function getFocusedIndex() {
    return comboBox._focusedIndex;
  }

  function inputChar(char) {
    const target = input;
    target.value += char;
    keyDownOn(target, char.charCodeAt(0));
    fire(target, 'input');
  }

  function inputText(text) {
    for (var i = 0; i < text.length; i++) {
      inputChar(text[i]);
    }
  }

  beforeEach(() => {
    comboBox = fixtureSync('<vaadin-combo-box></vaadin-combo-box>');
    comboBox.items = ['foo', 'bar', 'baz'];
    input = comboBox.inputElement;
  });

  describe('opening the overlay', () => {
    it('should open the overlay with arrow down and not focus any item', () => {
      arrowDownKeyDown(input);

      expect(comboBox.opened).to.equal(true);
      expect(getFocusedIndex()).to.equal(-1);
    });

    it('should open the overlay with arrow up and not focus any item', () => {
      arrowUpKeyDown(input);

      expect(comboBox.opened).to.equal(true);
      expect(getFocusedIndex()).to.equal(-1);
    });

    it('should have focus on the selected item after opened', () => {
      comboBox.value = 'foo';

      arrowDownKeyDown(input);

      expect(getFocusedIndex()).to.equal(0);
    });
  });

  describe('navigating the items after overlay opened', () => {
    beforeEach((done) =>
      setTimeout(() => {
        arrowDownKeyDown(input);
        done();
      })
    );

    it('should focus on the first item with arrow down', () => {
      arrowDownKeyDown(input);

      expect(getFocusedIndex()).to.equal(0);
    });

    it('should focus on the last item with up arrow', () => {
      arrowUpKeyDown(input);

      expect(getFocusedIndex()).to.equal(2);
    });

    it('should focus on the previous item with arrow up', () => {
      arrowDownKeyDown(input);
      arrowDownKeyDown(input);

      arrowUpKeyDown(input);

      expect(getFocusedIndex()).to.equal(0);
    });

    it('should not go below the last item', () => {
      arrowDownKeyDown(input);
      arrowDownKeyDown(input);
      arrowDownKeyDown(input);

      expect(getFocusedIndex()).to.equal(2);

      arrowDownKeyDown(input);

      expect(getFocusedIndex()).to.equal(2);
    });

    it('should not remove focus', () => {
      arrowDownKeyDown(input);

      arrowUpKeyDown(input);

      expect(getFocusedIndex()).to.equal(0);
    });

    it('should focus only on filtered items', () => {
      filter('foo');
      arrowDownKeyDown(input);

      expect(getFocusedIndex()).to.equal(0);

      arrowDownKeyDown(input);

      expect(getFocusedIndex()).to.equal(0);
    });
  });

  describe('selecting items', () => {
    beforeEach(async () => {
      comboBox.value = 'bar';

      comboBox.open();
      await aTimeout(1);
    });

    it('should select focused item with enter', async () => {
      arrowDownKeyDown(input);
      await aTimeout(1);
      enterKeyDown(input);
      await aTimeout(1);
      expect(comboBox.value).to.equal('baz');
    });

    it('should clear the selection with enter when input is cleared', () => {
      filter('');
      enterKeyDown(input);

      expect(comboBox.value).to.eql('');
    });

    it('should close the overlay with enter when custom values are allowed', () => {
      comboBox.allowCustomValue = true;
      filter('foobar');

      enterKeyDown(input);

      expect(comboBox.value).to.equal('foobar');
      expect(comboBox.opened).to.equal(false);
    });

    it('should stop propagation of the keyboard enter event', () => {
      const keydownSpy = sinon.spy();
      document.addEventListener('keydown', keydownSpy);
      enterKeyDown(input);
      expect(keydownSpy.called).to.be.false;
    });

    it('should not close the overlay with enter when custom values are not allowed', () => {
      filter('foobar');

      enterKeyDown(input);

      expect(comboBox.value).to.equal('bar');
      expect(comboBox.opened).to.equal(true);
    });

    it('should revert to the custom value after filtering', () => {
      comboBox.allowCustomValue = true;
      comboBox.value = 'foobar';
      filter('bar');
      escKeyDown(input);
      expect(input.value).to.eql('bar');
      escKeyDown(input);
      expect(input.value).to.equal('foobar');
    });

    it('should revert a non-listed value to the custom value after filtering', () => {
      comboBox.allowCustomValue = true;
      comboBox.value = 'foobar';
      filter('barbaz');
      escKeyDown(input);
      expect(input.value).to.equal('foobar');
    });

    it('should revert to the custom value after keyboar navigation', () => {
      comboBox.allowCustomValue = true;
      comboBox.value = 'foobar';
      arrowDownKeyDown(input);
      escKeyDown(input);
      expect(input.value).to.eql('foobar');
      escKeyDown(input);
      expect(input.value).to.equal('foobar');
    });

    it('should close the overlay with enter', () => {
      enterKeyDown(input);

      expect(comboBox.opened).to.equal(false);
    });

    it('should remove focus with escape', () => {
      comboBox._focusedIndex = 0;

      escKeyDown(input);

      expect(comboBox.opened).to.equal(true);
      expect(comboBox._focusedIndex).to.eql(-1);
    });

    it('should close the overlay with escape if there is no focus', () => {
      comboBox._focusedIndex = -1;

      escKeyDown(input);

      expect(comboBox.opened).to.equal(false);
    });

    it('escape key event should not be propagated', () => {
      const spy = sinon.spy();

      document.body.addEventListener('keydown', spy);
      escKeyDown(input);
      document.body.removeEventListener('keydown', spy);

      expect(spy.called).to.be.false;
    });

    it('should cancel typing with escape', () => {
      filter('baz');

      escKeyDown(input);

      expect(comboBox.value).to.equal('bar');
    });

    it('should select typed item', () => {
      filter('baz');

      enterKeyDown(input);

      expect(comboBox.value).to.equal('baz');
    });

    it('should reset the input value synchronously when keyboard navigating', () => {
      arrowDownKeyDown(input);
      expect(input.value).to.eql('');
    });

    it('should prefill the input field when navigating down', async () => {
      arrowDownKeyDown(input);
      await aTimeout(1);
      expect(input.value).to.eql('baz');
    });

    (isDesktopSafari ? it.skip : it)('should select the input field text when navigating down', async () => {
      arrowDownKeyDown(input);
      await aTimeout(1);
      expect(input.selectionStart).to.eql(0);
      expect(input.selectionEnd).to.eql(3);
    });

    it('should prefill the input field when navigating up', async () => {
      arrowUpKeyDown(input);
      await aTimeout(1);
      expect(input.value).to.eql('foo');
    });

    it('should not prefill the input when there are no items to navigate', async () => {
      filter('invalid filter');

      arrowDownKeyDown(input);
      await aTimeout(1);
      expect(input.value).to.eql('invalid filter');
    });

    (isDesktopSafari ? it.skip : it)('should select the input field text when navigating up', async () => {
      arrowUpKeyDown(input);
      await aTimeout(1);
      expect(input.selectionStart).to.eql(0);
      expect(input.selectionEnd).to.eql(3);
    });

    it('should revert back to filter with escape', async () => {
      filter('b');

      arrowDownKeyDown(input);
      await aTimeout(1);
      expect(input.value).to.eql('bar');
      escKeyDown(input);
      expect(input.value).to.eql('b');
    });

    it('should remove selection from the input value when reverting', () => {
      filter('b');
      arrowDownKeyDown(input);
      escKeyDown(input);

      expect(input.selectionStart).to.eql(input.selectionEnd);
    });

    it('should revert back to value if there is no filter', () => {
      arrowDownKeyDown(input);

      escKeyDown(input);

      expect(input.value).to.eql('bar');
    });

    it('should keep selected item on escape when custom value allowed', () => {
      comboBox.allowCustomValue = true;
      escKeyDown(input);
      escKeyDown(input);
      expect(comboBox.selectedItem).to.eql('bar');
    });

    it('should remove selection from the input value selecting value', async () => {
      arrowDownKeyDown(input);
      await aTimeout(1);
      enterKeyDown(input);

      expect(input.selectionStart).to.eql(3);
      expect(input.selectionEnd).to.eql(3);
    });
  });

  describe('scrolling items', () => {
    let selector;

    beforeEach(async () => {
      const items = [];

      for (let i = 0; i < 100; i++) {
        items.push(i.toString());
      }

      comboBox.open();
      selector = comboBox.$.overlay._selector;
      comboBox.items = items;

      await aTimeout(1);
    });

    it('should scroll down after reaching the last visible item', () => {
      selector.scrollToIndex(0);
      comboBox._focusedIndex = comboBox.$.overlay._visibleItemsCount() - 1;
      expect(selector.firstVisibleIndex).to.eql(0);

      arrowDownKeyDown(input);

      expect(selector.firstVisibleIndex).to.eql(1);
    });

    it('should scroll up after reaching the first visible item', () => {
      comboBox._focusedIndex = 1;
      selector.scrollToIndex(1);
      expect(selector.firstVisibleIndex).to.eql(1);

      arrowUpKeyDown(input);

      expect(selector.firstVisibleIndex).to.eql(0);
    });

    it('should scroll to first visible when navigating down above viewport', () => {
      comboBox._focusedIndex = 5;
      selector.scrollToIndex(50);

      arrowDownKeyDown(input);

      expect(selector.firstVisibleIndex).to.eql(6);
    });

    it('should scroll to first visible when navigating up above viewport', () => {
      comboBox._focusedIndex = 5;
      selector.scrollToIndex(50);

      arrowUpKeyDown(input);

      expect(selector.firstVisibleIndex).to.eql(4);
    });

    it('should scroll to last visible when navigating up below viewport', () => {
      comboBox._focusedIndex = 50;
      selector.scrollToIndex(0);
      expect(selector.firstVisibleIndex).to.eql(0);

      arrowUpKeyDown(input);

      expect(selector.firstVisibleIndex).to.eql(49 - comboBox.$.overlay._visibleItemsCount() + 1);
    });

    it('should scroll to last visible when navigating down below viewport', () => {
      comboBox._focusedIndex = 50;
      selector.scrollToIndex(0);
      expect(selector.firstVisibleIndex).to.eql(0);

      arrowDownKeyDown(input);

      expect(selector.firstVisibleIndex).to.eql(51 - comboBox.$.overlay._visibleItemsCount() + 1);
    });

    it('should scroll to start if no items focused when opening overlay', async () => {
      selector.scrollToIndex(50);
      comboBox.close();

      comboBox.open();
      await aTimeout(0);
      expect(selector.firstVisibleIndex).to.eql(0);
    });

    it('should scroll to focused item when opening overlay', async () => {
      selector.scrollToIndex(0);
      comboBox.close();
      comboBox.value = '50';

      comboBox.open();

      await onceScrolled(comboBox.$.overlay._scroller);
      expect(selector.firstVisibleIndex).to.be.within(50 - comboBox.$.overlay._visibleItemsCount(), 50);
    });
  });

  describe('auto open disabled', () => {
    beforeEach(() => {
      comboBox.autoOpenDisabled = true;
    });

    it('should open the overlay with arrow down', () => {
      arrowDownKeyDown(input);
      expect(comboBox.opened).to.equal(true);
    });

    it('should open the overlay with arrow up', () => {
      arrowUpKeyDown(input);
      expect(comboBox.opened).to.equal(true);
    });

    it('should apply input value on focusout if input valid', () => {
      inputText('FOO');
      focusout(comboBox);
      expect(input.value).to.equal('foo');
      expect(comboBox.value).to.equal('foo');
    });

    it('should apply input value on enter if input valid', () => {
      inputText('FOO');
      enterKeyDown(input);
      expect(input.value).to.equal('foo');
      expect(comboBox.value).to.equal('foo');
    });

    it('should not apply input value on enter if input invalid', () => {
      inputText('quux');
      enterKeyDown(input);
      expect(input.value).to.equal('quux');
      expect(comboBox.value).to.equal('');
    });

    it('should revert input value on focusout if input invalid', () => {
      inputText('quux');
      focusout(comboBox);
      expect(input.value).to.equal('');
      expect(comboBox.value).to.equal('');
    });

    it('should revert input value on esc if input valid', () => {
      inputText('foo');
      escKeyDown(input);
      expect(input.value).to.equal('');
      expect(comboBox.value).to.equal('');
    });

    it('should revert input value on esc if input invalid', () => {
      inputText('quux');
      escKeyDown(input);
      expect(input.value).to.equal('');
      expect(comboBox.value).to.equal('');
    });
  });
});