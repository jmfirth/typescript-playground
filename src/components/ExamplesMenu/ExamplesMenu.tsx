import * as React from 'react';
import { Label, List } from 'semantic-ui-react';
import { SidebarAccordion } from '../';
import './ExamplesMenu.css';

const createExample = (gistId: string, name: string = 'Unknown', tags: string[] = []) => ({ name, gistId, tags });

const examples = [
  createExample('52894fad18189e2aa909085c0aa7e989', 'Example site', ['react', 'react-router', 'victory']),
  createExample('a7face42d237a0e226efc467c3c6cfc0', 'Interactive Shapes', ['peact', 'pixi.js']),
  createExample('fd37c89fe9b9067d5bdb9df4b0e5f952', '3D Game of Life', ['regl', 'gl-matrix']),
];

const { origin, pathname } = window.location;
const baseUrl = `${origin}${pathname}`;

export default class ExamplesMenu extends React.PureComponent<{}, {}> {
  render() {

    return (
      <SidebarAccordion className="examples-menu" title="Examples">
        <List divided={false} relaxed={true}>
          {examples.map(example => (
            <List.Item as={'a'} href={`${baseUrl}?gistId=${example.gistId}`} key={example.gistId}>
              <List.Icon name="lab" size="large" verticalAlign="middle" />
              <List.Content>
                <List.Header>{example.name}</List.Header>
                <List.Description>
                  {example.tags.map(tag => (
                    <Label color="blue" horizontal={true} key={tag}>{tag}</Label>
                  ))}
                </List.Description>
              </List.Content>
            </List.Item>
          ))}
        </List>
      </SidebarAccordion>
    );
  }
}