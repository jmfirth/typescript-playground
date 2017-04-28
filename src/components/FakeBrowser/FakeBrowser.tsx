import * as React from 'react';
import { Button, Input, Menu } from 'semantic-ui-react';
import './FakeBrowser.css';

interface Props {
  url?: string;
  children?: React.ReactNode;
  onAddressChanged?: (url: string) => void;
  onRefreshClicked?: () => void;
  onHomeClicked?: () => void;
}

export default class FakeBrowser extends React.Component<Props, {}> {
  static defaultProps: {
    url: './index.html',
  };

  submitOnEnter = (e: KeyboardEvent) => {
    const { onAddressChanged } = this.props;
    const url = (e.target as HTMLInputElement).value;
    if (!onAddressChanged || e.key !== 'Enter' || !url) { return; }
    onAddressChanged(url);
  }

  render() {
    const { url, children, onRefreshClicked, onHomeClicked } = this.props;

    return (
      <div className="fake-browser">
        <Menu>
          <Menu.Item>
            <Button.Group>
              <Button icon="refresh" size="large" onClick={onRefreshClicked} />
              <Button icon="home" size="large" onClick={onHomeClicked} />
            </Button.Group>
          </Menu.Item>
          <Menu.Item className="fake-browser__menu-item--flex">
            <Input value={url} onKeyPress={this.submitOnEnter} inverted={true} />
          </Menu.Item>
        </Menu>
        {children}
      </div>
    );
  }
}