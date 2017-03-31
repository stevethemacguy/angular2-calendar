import { Angular2CalendarPage } from './app.po';

describe('angular2-calendar App', () => {
  let page: Angular2CalendarPage;

  beforeEach(() => {
    page = new Angular2CalendarPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
