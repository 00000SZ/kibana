/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { initMonaco, Monaco } from 'init-monaco';
import { editor } from 'monaco-editor';
import { ResizeChecker } from 'ui/resize_checker';
import { EditorActions } from '../components/editor/editor';
import { provideDefinition } from './definition/definition_provider';

import { parseSchema, toCanonicalUrl } from '../../common/uri_util';
import { history } from '../utils/url';
import { EditorService } from './editor_service';
import { HoverController } from './hover/hover_controller';
import { registerReferencesAction } from './references/references_action';
import { TextModelResolverService } from './textmodel_resolver';

export class MonacoHelper {
  public get initialized() {
    return this.monaco !== null;
  }
  public decorations: string[] = [];
  private monaco: Monaco | null = null;
  private editor: editor.IStandaloneCodeEditor | null = null;
  private resizeChecker: ResizeChecker | null = null;

  constructor(
    private readonly container: HTMLElement,
    private readonly editorActions: EditorActions
  ) {}
  public init() {
    return new Promise(resolve => {
      initMonaco((monaco: Monaco) => {
        this.monaco = monaco;
        // @ts-ignore  a hack to replace function in monaco editor.
        monaco.StandaloneCodeEditorServiceImpl.prototype.openCodeEditor =
          EditorService.prototype.openCodeEditor;
        //  @ts-ignore another hack to replace function
        this.monaco!.typescript.DefinitionAdapter.prototype.provideDefinition = (model, position) =>
          provideDefinition(monaco, model, position);

        this.editor = monaco.editor.create(
          this.container!,
          {
            readOnly: true,
            minimap: {
              enabled: false,
            },
            hover: {
              enabled: false, // disable default hover;
            },
            contextmenu: false,
            folding: false,
          },
          {
            textModelService: new TextModelResolverService(monaco),
          }
        );
        this.resizeChecker = new ResizeChecker(this.container);
        this.resizeChecker.on('resize', () => {
          setTimeout(() => {
            this.editor!.layout();
          });
        });
        registerReferencesAction(this.editor, this.editorActions);
        this.editor.onMouseDown((e: editor.IEditorMouseEvent) => {
          if (e.target.type === monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS) {
            const { uri } = parseSchema(this.editor!.getModel().uri.toString())!;
            history.push(`/${uri}!L${e.target.position.lineNumber}:0`);
          }
        });
        const hoverController: HoverController = new HoverController(this.editor);
        hoverController.setReduxActions(this.editorActions);
        resolve(this.editor);
      });
    });
  }

  public destroy = () => {
    this.monaco = null;
    if (this.resizeChecker) {
      this.resizeChecker!.destroy();
    }
  };

  public async loadFile(
    repoUri: string,
    file: string,
    text: string,
    lang: string,
    revision: string = 'master'
  ) {
    if (!this.initialized) {
      await this.init();
    }

    this.editor!.setModel(null);
    const uri = this.monaco!.Uri.parse(
      toCanonicalUrl({ schema: 'git:', repoUri, file, revision, pathType: 'blob' })
    );
    let newModel = this.monaco!.editor.getModel(uri);
    if (!newModel) {
      newModel = this.monaco!.editor.createModel(text, lang, uri);
    }
    this.editor!.setModel(newModel);
    return this.editor!;
  }

  public revealLine(line: number) {
    this.editor!.revealLineInCenter(line);
    this.editor!.setPosition({
      lineNumber: line,
      column: 1,
    });
    this.decorations = this.editor!.deltaDecorations(this.decorations, [
      {
        range: new this.monaco!.Range(line, 0, line, 0),
        options: {
          isWholeLine: true,
          inlineClassName: 'highlightInline',
          linesDecorationsClassName: 'markLineNumber',
        },
      },
    ]);
  }

  public revealPosition(line: number, pos: number) {
    const position = {
      lineNumber: line,
      column: pos,
    };
    this.decorations = this.editor!.deltaDecorations(this.decorations, [
      {
        range: new this.monaco!.Range(line, 0, line, 0),
        options: {
          isWholeLine: true,
          inlineClassName: 'highlightInline',
          linesDecorationsClassName: 'markLineNumber',
        },
      },
    ]);
    this.editor!.revealPositionInCenter(position);
    this.editor!.setPosition(position);
  }
}
