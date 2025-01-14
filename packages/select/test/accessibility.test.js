import { expect } from '@esm-bundle/chai';
import { fixtureSync, nextFrame } from '@vaadin/testing-helpers';
import { html, render } from 'lit';
import '@vaadin/item/vaadin-item.js';
import '@vaadin/list-box/vaadin-list-box.js';
import './not-animated-styles.js';
import '../vaadin-select.js';

describe('accessibility', () => {
  let select, valueButton;

  beforeEach(async () => {
    select = fixtureSync(`<vaadin-select label="Label"></vaadin-select>`);
    select.renderer = (root) => {
      if (root.firstElementChild) {
        return;
      }
      render(
        html`
          <vaadin-list-box>
            <vaadin-item>Option 1</vaadin-item>
            <vaadin-item>Option 2</vaadin-item>
          </vaadin-list-box>
        `,
        root
      );
    };
    await nextFrame();
    valueButton = select._valueButton;
  });

  it('should have aria-required attribute set to true when required', () => {
    select.required = true;
    expect(valueButton.getAttribute('aria-required')).to.be.equal('true');
  });

  it('should have aria-disabled attribute set to true when disabled', () => {
    select.disabled = true;
    expect(select.getAttribute('aria-disabled')).to.be.equal('true');
  });

  it('should set aria-expanded attribute on the value button', () => {
    expect(valueButton.getAttribute('aria-expanded')).to.be.equal('false');
    select.opened = true;
    expect(valueButton.getAttribute('aria-expanded')).to.be.equal('true');
  });

  it('should set aria-labelledby on the value button', () => {
    expect(valueButton.getAttribute('aria-labelledby')).to.not.be.empty;
  });

  it('should set aria-describedby on the value button when invalid', () => {
    select.errorMessage = 'invalid';
    select.invalid = true;
    expect(valueButton.getAttribute('aria-describedby')).to.not.be.empty;
  });

  it('should have role listbox on menu element', () => {
    expect(select._menuElement.getAttribute('role')).to.equal('listbox');
  });

  it('should have role option on items', async () => {
    // Wait for items
    await nextFrame();
    expect(select._items[0].getAttribute('role')).to.equal('option');
    expect(select._items[1].getAttribute('role')).to.equal('option');
  });

  it('should set ID attribute on the selected item', async () => {
    // Wait for items
    await nextFrame();
    select.value = 'Option 1';
    const ID_REGEX = /^vaadin-select-\d+$/;
    const id = valueButton.firstChild.getAttribute('id');
    expect(id).to.match(ID_REGEX);
  });

  it('should include selected item ID to aria-labelledby', async () => {
    // Wait for items
    await nextFrame();
    select.value = 'Option 1';
    const id = valueButton.firstChild.getAttribute('id');
    expect(valueButton.getAttribute('aria-labelledby')).to.include(id);
  });
});
