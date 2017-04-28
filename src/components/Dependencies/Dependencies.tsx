import * as React from 'react';
import { Input, List } from 'semantic-ui-react';
import { SidebarAccordion } from '../';
import { Project } from '../../utilities';
import './Dependencies.css';

interface Props {
  modules: Project.Modules;
  definitions: Project.Definitions;
  onAddModule?: (moduleName: string, moduleVersion: string) => void;
  onRemoveModule?: (moduleName: string) => void;
  onAddDefinition?: (definitionName: string) => void;
  onRemoveDefinition?: (definitionFilePath: string) => void;
}

export default class Dependencies extends React.Component<Props, {}> {
  modulesInputKeyUp = (event: KeyboardEvent) => {
    const { onAddModule } = this.props;
    if (event.key !== 'Enter' || !onAddModule) { return; }
    const moduleNameAndVersion = event.target['value'] as string; // tslint:disable-line no-string-literal
    const split = moduleNameAndVersion.split('@');
    if (split.length !== 2) { return; }
    const [moduleName, moduleVersion] = split;
    onAddModule(moduleName, moduleVersion);
  }

  definitionsInputKeyUp = (event: KeyboardEvent) => {
    const { onAddDefinition } = this.props;
    if (event.key !== 'Enter' || !onAddDefinition) { return; }
    const definitionName = event.target['value'] as string; // tslint:disable-line no-string-literal
    onAddDefinition(definitionName);
  }

  render() {
    const { definitions, modules, onRemoveModule, onRemoveDefinition } = this.props;
    return (
      <div>
        <SidebarAccordion title="Modules" className="dependencies">
          <List>
            {Object.keys(modules).map((moduleName, index) => (
              <List.Item key={moduleName}>
                <List.Icon
                  name="remove"
                  size="large"
                  verticalAlign="middle"
                  onClick={() => onRemoveModule && onRemoveModule(moduleName)}
                />
                <List.Content>
                  {`${moduleName}@${modules[moduleName]}`}
                </List.Content>
              </List.Item>
            ))}
            <List.Item>
              <List.Content>
                <Input
                  placeholder="add new module (e.g. react@latest)"
                  onKeyUp={this.modulesInputKeyUp}
                />
              </List.Content>
            </List.Item>
          </List>
        </SidebarAccordion>

        <SidebarAccordion title="Definitions">
          <List>
            {Object.keys(definitions).map((definitionName, index) => (
              <List.Item key={definitionName}>
                <List.Icon
                  name="remove"
                  size="large"
                  verticalAlign="middle"
                  onClick={() => onRemoveDefinition && onRemoveDefinition(definitionName)}
                />
                <List.Content>
                  {definitionName.substring(0, definitionName.indexOf('/'))}
                </List.Content>
              </List.Item>
            ))}
            <List.Item>
              <List.Content>
                <Input
                  placeholder="add new definition (e.g. react)"
                  onKeyUp={this.definitionsInputKeyUp}
                />
              </List.Content>
            </List.Item>
          </List>
        </SidebarAccordion>
      </div>
    );
  }
}