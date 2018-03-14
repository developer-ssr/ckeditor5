/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* globals document, Event */

import ComponentFactory from '@ckeditor/ckeditor5-ui/src/componentfactory';
import View from '@ckeditor/ckeditor5-ui/src/view';

import VirtualTestEditor from '@ckeditor/ckeditor5-core/tests/_utils/virtualtesteditor';
import DecoupledEditorUI from '../src/decouplededitorui';
import DecoupledEditorUIView from '../src/decouplededitoruiview';

import FocusTracker from '@ckeditor/ckeditor5-utils/src/focustracker';

import { keyCodes } from '@ckeditor/ckeditor5-utils/src/keyboard';
import testUtils from '@ckeditor/ckeditor5-core/tests/_utils/utils';
import utils from '@ckeditor/ckeditor5-utils/tests/_utils/utils';

testUtils.createSinonSandbox();

describe( 'DecoupledEditorUI', () => {
	let editor, view, ui;

	beforeEach( () => {
		return VirtualDecoupledTestEditor
			.create( {
				toolbar: [ 'foo', 'bar' ],
			} )
			.then( newEditor => {
				editor = newEditor;

				ui = editor.ui;
				view = ui.view;
			} );
	} );

	afterEach( () => {
		editor.destroy();
	} );

	describe( 'constructor()', () => {
		it( 'sets #editor', () => {
			expect( ui.editor ).to.equal( editor );
		} );

		it( 'sets #view', () => {
			expect( ui.view ).to.be.instanceOf( DecoupledEditorUIView );
		} );

		it( 'creates #componentFactory factory', () => {
			expect( ui.componentFactory ).to.be.instanceOf( ComponentFactory );
		} );

		it( 'creates #focusTracker', () => {
			expect( ui.focusTracker ).to.be.instanceOf( FocusTracker );
		} );
	} );

	describe( 'init()', () => {
		it( 'renders the #view', () => {
			expect( view.isRendered ).to.be.true;
		} );

		describe( 'config', () => {
			it( 'does nothing if not specified', () => {
				expect( view.toolbar.element.parentElement ).to.be.null;
				expect( view.editable.element.parentElement ).to.be.null;
			} );

			it( 'allocates view#toolbar', () => {
				return VirtualDecoupledTestEditor
					.create( {
						toolbar: [ 'foo', 'bar' ],
						toolbarContainer: document.body
					} )
					.then( newEditor => {
						expect( newEditor.ui.view.toolbar.element.parentElement ).to.equal( document.body );

						return newEditor;
					} )
					.then( newEditor => {
						newEditor.destroy();
					} );
			} );

			it( 'allocates view#editable', () => {
				return VirtualDecoupledTestEditor
					.create( {
						toolbar: [ 'foo', 'bar' ],
						editableContainer: document.body
					} )
					.then( newEditor => {
						expect( newEditor.ui.view.editable.element.parentElement ).to.equal( document.body );

						return newEditor;
					} )
					.then( newEditor => {
						newEditor.destroy();
					} );
			} );
		} );

		describe( 'editable', () => {
			it( 'registers view.editable#element in editor focus tracker', () => {
				ui.focusTracker.isFocused = false;

				view.editable.element.dispatchEvent( new Event( 'focus' ) );
				expect( ui.focusTracker.isFocused ).to.true;
			} );

			it( 'sets view.editable#name', () => {
				const editable = editor.editing.view.document.getRoot();

				expect( view.editable.name ).to.equal( editable.rootName );
			} );

			it( 'binds view.editable#isFocused', () => {
				utils.assertBinding(
					view.editable,
					{ isFocused: false },
					[
						[ editor.editing.view.document, { isFocused: true } ]
					],
					{ isFocused: true }
				);
			} );

			it( 'binds view.editable#isReadOnly', () => {
				const editable = editor.editing.view.document.getRoot();

				utils.assertBinding(
					view.editable,
					{ isReadOnly: false },
					[
						[ editable, { isReadOnly: true } ]
					],
					{ isReadOnly: true }
				);
			} );
		} );

		describe( 'view.toolbar#items', () => {
			it( 'are filled with the config.toolbar (specified as an Array)', () => {
				return VirtualDecoupledTestEditor
					.create( {
						toolbar: [ 'foo', 'bar' ]
					} )
					.then( editor => {
						const items = editor.ui.view.toolbar.items;

						expect( items.get( 0 ).name ).to.equal( 'foo' );
						expect( items.get( 1 ).name ).to.equal( 'bar' );

						return editor.destroy();
					} );
			} );

			it( 'are filled with the config.toolbar (specified as an Object)', () => {
				return VirtualDecoupledTestEditor
					.create( {
						toolbar: {
							items: [ 'foo', 'bar' ],
							viewportTopOffset: 100
						}
					} )
					.then( editor => {
						const items = editor.ui.view.toolbar.items;

						expect( items.get( 0 ).name ).to.equal( 'foo' );
						expect( items.get( 1 ).name ).to.equal( 'bar' );

						return editor.destroy();
					} );
			} );
		} );

		it( 'initializes keyboard navigation between view#toolbar and view#editable', () => {
			return VirtualDecoupledTestEditor.create()
				.then( editor => {
					const ui = editor.ui;
					const view = ui.view;
					const spy = testUtils.sinon.spy( view.toolbar, 'focus' );

					ui.focusTracker.isFocused = true;
					ui.view.toolbar.focusTracker.isFocused = false;

					editor.keystrokes.press( {
						keyCode: keyCodes.f10,
						altKey: true,
						preventDefault: sinon.spy(),
						stopPropagation: sinon.spy()
					} );

					sinon.assert.calledOnce( spy );

					return editor.destroy();
				} );
		} );
	} );

	describe( 'destroy()', () => {
		it( 'destroys the #view', () => {
			const spy = sinon.spy( view, 'destroy' );

			return editor.destroy()
				.then( () => {
					sinon.assert.calledOnce( spy );
					sinon.assert.calledWithExactly( spy, false, false );
				} );
		} );

		it( 'removes view#toolbar from DOM, if config.toolbarContainer is specified', () => {
			let spy;

			return VirtualDecoupledTestEditor
				.create( {
					toolbar: [ 'foo', 'bar' ],
					toolbarContainer: document.body
				} )
				.then( newEditor => {
					spy = sinon.spy( newEditor.ui.view, 'destroy' );

					newEditor.destroy();
				} )
				.then( () => {
					sinon.assert.calledWithExactly( spy, true, false );
				} );
		} );

		it( 'removes view#editable from DOM, if config.editableContainer is specified', () => {
			let spy;

			return VirtualDecoupledTestEditor
				.create( {
					toolbar: [ 'foo', 'bar' ],
					editableContainer: document.body
				} )
				.then( newEditor => {
					spy = sinon.spy( newEditor.ui.view, 'destroy' );

					newEditor.destroy();
				} )
				.then( () => {
					sinon.assert.calledWithExactly( spy, false, true );
				} );
		} );
	} );
} );

function viewCreator( name ) {
	return locale => {
		const view = new View( locale );

		view.name = name;
		view.element = document.createElement( 'a' );

		return view;
	};
}

class VirtualDecoupledTestEditor extends VirtualTestEditor {
	constructor( config ) {
		super( config );

		const view = new DecoupledEditorUIView( this.locale );
		this.ui = new DecoupledEditorUI( this, view );

		this.ui.componentFactory.add( 'foo', viewCreator( 'foo' ) );
		this.ui.componentFactory.add( 'bar', viewCreator( 'bar' ) );
	}

	destroy() {
		this.ui.destroy();

		return super.destroy();
	}

	static create( config ) {
		return new Promise( resolve => {
			const editor = new this( config );

			resolve(
				editor.initPlugins()
					.then( () => {
						editor.ui.init();
						editor.fire( 'uiReady' );
						editor.fire( 'dataReady' );
						editor.fire( 'ready' );
					} )
					.then( () => editor )
			);
		} );
	}
}
