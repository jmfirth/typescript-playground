import { h, Component } from 'preact';
import { IconButton } from './';
import { Project } from '../utilities';

interface Props {
  modules?: Project.ModuleMap;
  onAddModule: () => void;
  onRemoveModule: (filePath: string) => void;
  onModuleNameChanged: (oldFilePath: string, newFilePath: string) => void;
  onModuleVersionChanged: (filePath: string, url: string) => void;
}

export default class ModulesEditor extends Component<Props, void> {
  render() {
    const {
      onAddModule,
      onRemoveModule,
      onModuleNameChanged,
      onModuleVersionChanged,
      modules = {}
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
                  onClick={onAddModule}
                />
              </th>
              <th>Name</th>
              <th>Version</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(modules).map(moduleName => (
              <tr>
                <td className="center">
                  <IconButton
                    tooltip="Remove module"
                    name="minus"
                    onClick={() => onRemoveModule(moduleName)}
                  />
                </td>
                <td
                  contentEditable={true}
                  onBlur={(e: FocusEvent) => {
                    const newModuleName = (e.target as HTMLTableCellElement).innerText;
                    if (newModuleName !== moduleName) {
                      onModuleNameChanged(moduleName, newModuleName);
                    }
                  }}
                >
                  {moduleName}
                </td>
                <td
                  contentEditable={true}
                  onBlur={(e: FocusEvent) => {
                    const url = (e.target as HTMLTableCellElement).innerText;
                    if (modules && modules[moduleName] !== url) {
                      onModuleVersionChanged(moduleName, url);
                    }
                  }}
                >
                  {modules && modules[moduleName]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}