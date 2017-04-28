import * as React from 'react';
import './Buffer.css';

interface Props { children?: React.ReactNode; }

export default ({ children }: Props) => <div className="code-frame">{children}</div>;