import { h, Component } from 'preact';
import { IconButton } from './';
import * as Definitions from '../definitions';

interface Props {
  definitions?: Definitions.Definitions;
  onAddDefinition: () => void;
  onRemoveDefinition: (filePath: string) => void;
  onFilePathChanged: (oldFilePath: string, newFilePath: string) => void;
  onUrlChanged: (filePath: string, url: string) => void;
}

export default class DefinitionsEditor extends Component<Props, void> {
  render() {
    const {
      onAddDefinition,
      onRemoveDefinition,
      onFilePathChanged,
      onUrlChanged,
      definitions = {}
    } = this.props;

    return (
      <div id="definitions-editor">
        <table width="100%">
          <thead>
            <tr>
              <th>
                <IconButton
                  tooltip="Add definition"
                  name="plus"
                  onClick={onAddDefinition}
                />
              </th>
              <th>Path</th>
              <th>URL</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(definitions).map(filePath => (
              <tr>
                <td className="center">
                  <IconButton
                    tooltip="Remove definition"
                    name="minus"
                    onClick={() => onRemoveDefinition(filePath)}
                  />
                </td>
                <td
                  contentEditable={true}
                  onBlur={(e: FocusEvent) => {
                    const newFilePath = (e.target as HTMLTableCellElement).innerText;
                    if (newFilePath !== filePath) {
                      onFilePathChanged(filePath, newFilePath);
                    }
                  }}
                >
                  {filePath}
                </td>
                <td
                  contentEditable={true}
                  onBlur={(e: FocusEvent) => {
                    const url = (e.target as HTMLTableCellElement).innerText;
                    if (definitions && definitions[filePath] !== url) {
                      onUrlChanged(filePath, url);
                    }
                  }}
                >
                  {definitions && definitions[filePath]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}