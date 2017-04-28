import * as React from 'react';
import { Button, Icon, List } from 'semantic-ui-react';
import { SidebarAccordion } from '../';
import { Github } from '../../utilities';
import './GithubMenu.css';

interface Props {
  user?: Github.GithubAuthenticatedUser;
  onSaveOrUpdate?: () => void;
}

interface State {
  gists?: Github.Gist[];
}

export default class GithubMenu extends React.Component<Props, State> {
  state: State = {
    gists: undefined,
  };

  componentWillMount() {
    this.listGists();
  }

  async listGists() {
    const gists = await Github.listGists();
    if (!gists) { return; }
    this.setState({ gists });
  }

  render() {
    const { user, onSaveOrUpdate } = this.props;
    const { gists } = this.state;
    const { origin, pathname } = window.location;
    const baseUrl = `${origin}${pathname}`;

    const titleActions = [];
    if (onSaveOrUpdate) { titleActions.push({ iconName: 'fork', onClick: onSaveOrUpdate }); }

    return (
      <div className="github-menu">
        {!user
          ? (
            <div className="github-menu__login-message">
              <h2>Login to continue</h2>
              <p>Login with Github to save and update your work as a Gist.</p>
              <Button as="a" color="black" href={Github.GITHUB_OAUTH_URL}>
                <Icon name="github" /> Login
              </Button>
            </div>
          )
          : (
            <div>
              <SidebarAccordion title={user.name} titleActions={titleActions}>
                <div className="github-menu__profile">
                  <img src={user.avatar_url} />
                  <div>
                    <Button as="a" color="black" href={Github.GITHUB_OAUTH_URL}>
                      <Icon name="github" /> Logout
                    </Button>
                  </div>
                </div>
              </SidebarAccordion>
              {gists && (
                <SidebarAccordion title="Your Gists">
                  <List>
                    {gists.map(gist => (
                      <List.Item>
                        <List.Icon
                          name="code"
                          size="large"
                          verticalAlign="middle"
                        />
                        <List.Content>
                          <a href={`${baseUrl}?gistId=${gist.id}`}>{gist.description}</a>
                        </List.Content>
                      </List.Item>
                    ))}
                  </List>
                </SidebarAccordion>
              )}
            </div>
          )
        }
      </div>
    );
  }
}
