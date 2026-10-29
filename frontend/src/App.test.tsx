import { render } from '@testing-library/react';
import App from './App';

test('renders VigilShield app without crashing', () => {
  render(<App />);
  expect(document.body).toBeInTheDocument();
});
