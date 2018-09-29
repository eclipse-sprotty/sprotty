/********************************************************************************
 * Copyright (c) 2018 TypeFox and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

/*
 * This file is not bundled through webpack, but loaded directly from the web page.
 */

var baseUrl = '/';
require.config({
    baseUrl: baseUrl,
    paths: {
        'jquery': 'webjars/jquery/2.2.4/jquery.min',
        'ace/ext/language_tools': 'webjars/ace/1.2.3/src/ext-language_tools',
        'xtext/xtext-ace': 'xtext/2.13.0/xtext-ace'
    }
});
require(['webjars/ace/1.2.3/src/ace'], function() {
    require(['xtext/xtext-ace', 'jquery'], function(xtext, jQuery) {
        var editor = xtext.createEditor({
            xtextLang: 'multicore',
            baseUrl: baseUrl,
            syntaxDefinition: 'xtext-resources/generated/mode-multicore',
            selectionUpdateDelay: 50
        });
        var services = editor.xtextServices;
        var editorAccess = services.editorContext;
        window.xtextServices = services;
        var executionState = {
            running: false
        };
        function stopExecution() {
            if (executionState.running) {
                executionState.running = false;
                clearTimeout(executionState.timeoutId);
            }
        }

        // Execution button handling

        var toggleExecutionButtons = function(){
            var playBtn = jQuery("#execution-run span");
            playBtn.toggleClass('glyphicon-play', !executionState.running);
            playBtn.toggleClass('glyphicon-pause', executionState.running);
        }

        // Handling example files --------

        var examples = ['example01', 'example02'];
        var exampleSelectionEl = jQuery('#example-selection');
        var exampleChangeHandler = function(chosenExample){
            jQuery.ajax('/examples/' + chosenExample + '.multicore').done(function(exampleCode) {
                editorAccess.setText(exampleCode);
            });
        };

        jQuery.each(examples, function(idx, val){
            exampleSelectionEl.append(jQuery('<option>', {'value':val, text:val}));
        });

        exampleSelectionEl.change(function(){
            exampleChangeHandler(exampleSelectionEl.val());
            stopExecution();
            toggleExecutionButtons();
        });

        // Load first example initially.
        exampleChangeHandler(examples[0]);


        // Create custom services --------

        require(['xtext/services/XtextService', 'xtext/ServiceBuilder'], function(XtextService, ServiceBuilder) {
            services.selectionService = new XtextService();
            services.selectionService.initialize(services, 'select');
            services.selectionService._initServerData = function(serverData, editorContext, params) {
                serverData.elementId = params.elementId;
                serverData.modelType = params.modelType;
                serverData.stepType = params.stepType;
                serverData.caretOffset = editorContext.getCaretOffset();
            }

            services.select = function(addParams) {
                var params = ServiceBuilder.mergeOptions(addParams, services.options);
                return services.selectionService.invoke(editorAccess, params).done(function(result) {
                    var currentOffset = editorAccess.getCaretOffset();
                    if (result.offset >= 0 && result.offset != currentOffset) {
                        var pos = editor.getSession().getDocument().indexToPosition(result.offset);
                        editor.scrollToLine(pos.row, true, true);
                        editor.moveCursorTo(pos.row, pos.column);
                        editor.clearSelection();
                    } else {
                        stopExecution();
                        toggleExecutionButtons();
                    }
                });
            }
        });


        // Handling execution buttons --------

        jQuery('#execution-run').click(function(event) {
            if (!executionState.running) {
                executionState.running = true;
                function nextStep() {
                    services.select({ stepType: 'next' });
                    executionState.timeoutId = setTimeout(nextStep, 2000);
                }
                nextStep();
            } else {
                stopExecution();
            }
        });
        jQuery('#execution-previous').click(function(event) {
            services.select({ stepType: 'previous' });
            stopExecution();
        });
        jQuery('#execution-next').click(function(event) {
            services.select({ stepType: 'next' });
            stopExecution();
        });
        jQuery('.executionButtons button').click(function(){
            toggleExecutionButtons();
        })
    });
});


