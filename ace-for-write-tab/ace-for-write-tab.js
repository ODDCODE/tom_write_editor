(function ($) {

	/*
	 * Get JSON Prefs file
	 */
	function getPrefs (){
		var json = null;
		$.ajax({
	        url: "ace-for-txp/prefs.js",
	        async: false,
	        global: false,
	        dataType: "json",
	        success: function (data) {
	        	// console.log(data);
	            json = data;
	        },
	        error: function(){
	        	console.error('ajax error: ');
	        }
	    });
	    return json;
	}

	// CamelCase to phrase
	// function CamelCaseToPhrase(camelCase) {
	//	return camelCase.split(/(?=[A-Z])/).join(' ');
	// }

	// Render Shortcut on html Table
	function renderTable(data) {
		if (data.target) {
            var commands = data.content.reduce(function(previous, current) {
                return previous + '<tr>' + 
                    '<td>' + current[data.col1] + '</td> ' +
                    '<td>' + current[data.col2] + '</td>' +
                    '</tr>';
            }, '');

            data.target.innerHTML = '<h1>' + data.title +'</h1> <table>' + commands + '</table>';
		}
	}


		// Store Prefs
	var	prefs = getPrefs(),

		editor = {},
		txpWritePage = {},

		// Store some Txp write page elements
		txpWritePageObj = function() {
			txpWritePage.$title = $('#title');
			txpWritePage.$body = $('#body');
			txpWritePage.$publish = $('.publish');
		},		

		// Store Editor Objects
		initEditorObj = function() {
			editor.btn = {
				"$show" : $('<a class="show-ace ace-show-hide"><i>fullscreen</i></a>').prependTo('.body'),
				"$hide" : $('#ace-hide-btn'),
				"$save": $('#ace-save-btn'),
				// "$iframeSrcs": $('#ace-iframe-btn').find('button'),
				// "$help" : $('#ace-help-btns').find('button'),
				"$rightContent" : $('#ace-rightcontent-btns').find('input'), 
				"$rightSize" : $('#ace-panel-size-btns').find('input')
			};
			editor.panel = {
				$right : $('#ace-panel-right'),
				$left : $('#ace-panel-left') 
			};
			editor.panel.$right.size = 0;
			editor.title = document.getElementsByClassName('ace-article_title');
			editor.open = false;
			editor.iframe = {
				el : document.getElementById('ace-iframe'),
				page : undefined
			};
			editor.help = {
				el : document.getElementById('ace-help'),
				page: undefined
			};
		},

		// Init Ace Editor with some options
		initAce = function(wrapper) {
			editor.ace = ace.edit(wrapper);	// Initialize Ace Editor

			// THEME
			editor.ace.setTheme("ace/theme/sacripant");
			// MODE			
			editor.ace.getSession().setMode("ace/mode/textile");
			// editor.ace options
			editor.ace.getSession().setUseWrapMode(true);
			editor.ace.setShowPrintMargin(true);
			editor.ace.setOptions({
	        	enableSnippets: true,
	        	fontSize: "16px"
		    });

			// synchronize with textarea
			editor.ace.getSession().on('change', function(){
				txpWritePage.$body.val(editor.ace.getSession().getValue());
			});


			// console.log(editor.ace);
			// console.log(editor.ace.session.$modeId.split('/').pop());


   			// console.log(getKeybordShortcuts(editor.ace));
			editor.ace.commands.addCommand({
		        name: "showKeyboardShortcuts",
		        bindKey: {win: "Ctrl-Alt-k", mac: "Command-Alt-k"},
		        exec: function(AceEditor) {
		        	var action = 'shortcuts';
	        		hideIframe();
	        		hideHelp();

		            ace.config.loadModule("ace/ext/menu_tools/get_editor_keyboard_shortcuts", function(module) {
		                editor.keybordShortcuts = module.getEditorKeybordShortcuts(AceEditor);
            			showHelp(action);
		            });
		        }
	    	});

			editor.ace.commands.addCommand({
		        name: "showSnippets",
		        bindKey: {win: "Ctrl-Alt-s", mac: "Command-Alt-s"},
		        exec: function(AceEditor) {
		        	var action = 'snippets';
	        		hideIframe();
	        		hideHelp();
		            ace.config.loadModule("ace/snippets", function(module) {
		                editor.snippets = module.snippetManager.snippetMap[AceEditor.session.$modeId.split('/').pop()];
            			showHelp(action);
		            });
		        }
	    	});
		},


		// Images, files, links, Drag and drop Handler 
		dndHandler = {
		    draggedElement: null, // Propriété pointant vers l'élément en cours de déplacement
		    applyDragEvents: function(element, pageName) {

		        element.draggable = true;
		        var dndHandler = this; // Cette variable est nécessaire pour que l'événement « dragstart » accède facilement au namespace « dndHandler »

				element.addEventListener('dragstart', function(e) {
					dndHandler.draggedElement = e.target; // On sauvegarde l'élément en cours de déplacement
					e.itemId = $(dndHandler.draggedElement).find('input')[0].value;
					console.log(e.itemId);
		            e.dataTransfer.setData('text', replaceID(prefs.drop[pageName], e.itemId)); // Nécessaire pour Firefox
		        });
		    }
		},

		// inject id in snippet
		replaceID = function(string, id) {
			return string.replace('{{ id }}', id);
		}, 

	
		// Show Editor
		showEditor = function() {
			// copy textarea content in Ace editor
			editor.ace.getSession().setValue(txpWritePage.$body.val());

			// add focus in top on Editor
			editor.ace.focus();
						
			// Clone article title
			$(editor.title).text(txpWritePage.$title.val());
						
			// Show Editor
			$('html').addClass('ace-editor-on');

			editor.open = true;
		},

		// Hide Editor
		hideEditor = function() {
			$('html').removeClass('ace-editor-on');	

			editor.open = false;			
		},



		removeRightPanelContent = function () {
			console.log("remove panel right content");
				hideIframe();
				hideHelp();
				// uncheck right panel content btns
				editor.btn.$rightContent.filter(":checked")[0].checked = false;				
				// console.log(chkBtn);
		},



		changeRightPanelSize = function(newSize) {
			console.log(newSize);
			editor.panel.$right.size = newSize;

			editor.panel.$right
				.css("flexGrow", newSize);
		},

		rightPanelContent = function(btn) {

			if (!btn){
				return false;
			}

			//	If Right Panel is close
			//	Open right panel and wheck relative radio btn 
			if (editor.panel.$right.size === "0") {
				changeRightPanelSize(prefs.rightPanelDefaultSize);
				// check relative radio btn
				editor.btn.$rightSize.filter("[value=" + prefs.rightPanelDefaultSize + "]")[0].checked = true;
			}

			var content = btn.value,
				type = btn.dataset.type;

			console.log(content + " / " + type);

			if (content && type) {

				switch(type) {
					case 'iframe':
						hideIframe();
			 			hideHelp();
						showIframe(content);

						break;

					case 'help-table':
						switch(content) {
							case 'shortcuts':
						    	editor.ace.execCommand("showKeyboardShortcuts");
								break;
							case 'snippets':
						    	editor.ace.execCommand("showSnippets");
								break;
						}
						break;
				}

			}
		},

		// Load Txp pages in right panel iframe
		showIframe = function(pageName) {
			editor.iframe.el.src = prefs.path[pageName];
			$(editor.iframe.el).on('load', function() {
				var iframeContent = $(editor.iframe.el).contents(),
					dragItems = iframeContent.find('.txp-list tbody tr');

				// console.log(dragItems);

				dragItems.each(function(index, el) {
					dndHandler.applyDragEvents(el, pageName);
				});

				editor.iframe.el.classList.remove('hide');
				editor.iframe.page = pageName; });
		},

		hideIframe = function() {
			if (editor.iframe.page) {
				editor.iframe.el.classList.add('hide');
				$(editor.iframe.el).off('load');
				editor.iframe.page = undefined;
			}
		},

		showHelp = function(action) {
			switch(action) {
				case 'shortcuts':
					renderTable({
						content: editor.keybordShortcuts,
						target: editor.help.el,
						title: action,
						col1Title: 'command',
						col1: "command",
						col2Title: "shortcut",
						col2: "key"
					});
					break;

				case 'snippets':
					renderTable({
						content: editor.snippets,
						target: editor.help.el,
						title: action,
						col1Title: 'Tab trigger',
						col1: "tabTrigger",
						col2Title: "snippet",
						col2: "content"
					});
					break;
			}
			editor.help.page = action;
			editor.help.el.classList.remove('hide');
		},

		hideHelp = function () {
			if (editor.help.page) {
				editor.help.el.classList.add('hide');
				editor.help.page = undefined;				
			}
		};


	window.onload = function() {
		
		txpWritePageObj();
		initEditorObj();
		initAce('ace-editor');	

		// console.log(editor.ace);

		// Store Ace Keybords
		
				
		// show Editor
		editor.btn.$show.click(function() {
			showEditor();
		});
		
		// Hide Editor	
		editor.btn.$hide.click(function() {
			hideEditor();			
		});
		
		// trigger save on save button
		// editor.btn.save[0].value += ' | '+key+'+s';
		editor.btn.$save.click(function(){
			txpWritePage.$publish.click();
		});

		// Load right Panel content
		rightPanelContent(editor.btn.$rightContent.filter(':checked')[0]);
		editor.btn.$rightContent.change(function() {
			rightPanelContent(this);
		});

		// change right panel size
		// changeRightPanelSize(editor.btn.$rightSize.filter(':checked')[0].value);
		editor.btn.$rightSize.change(function() {
			console.log("click btn size");
			changeRightPanelSize(this.value);
		})
		$(editor.btn.$rightSize.filter(':checked')).change();


		editor.panel.$right.on('transitionend', function () {
			// console.log("panel transitionEnd");
			editor.ace.resize();

			console.log(editor.panel.$right.size === '0');	
			if (editor.panel.$right.size === '0') removeRightPanelContent();
		});

		// console.log(editor.panel.$right);
								
		$(document).keydown(function(e) {
			if (editor.open) {
				// esc = hide Editor
				if (e.keyCode === 27) {
					console.log("Esc editor");
					hideEditor();									
				}
			}
			// Save
			// if (e.keyCode == 83 && (e.metaKey || e.ctrlKey)) {
			// 	e.preventDefault();
			// 	txpWritePage.publish.click();
			// }
		});


		// TEST: Make image panel draggable

		// Select image iframe content
		// var iframeContent = $("#ace-image-panel").contents(),
		// 	images = iframeContent.find('#images_form tr');

		// 	console.log(images);

		// var dropImageSnippet = function(data) {
		// 	return replaceID(prefs.drop.img, data);
		// };




		// images.each(function(index, el) {
		// 	dndHandler.applyDragEvents(el);
		// });
		


};


})(jQuery);
