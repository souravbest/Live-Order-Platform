describe('OrderPulse – Main Flow E2E', () => {
  it('loads the dashboard, searches for an order, opens the drawer, and performs an action', () => {
    cy.visit('/');

    // 1. Dashboard loads with KPI panel
    cy.contains('Total Orders').should('be.visible');
    cy.contains('Processing').should('be.visible');

    // 2. Verify virtualized grid shows rows
    cy.get('[role="row"]').should('have.length.gt', 1);

    // 3. Search for a specific order
    cy.get('input[type="search"]').type('ORD-000100');
    cy.get('[role="row"]').should('have.length.lte', 5);

    // 4. Click a row to open the drawer
    cy.get('[role="row"]').first().click();

    // 5. Drawer opens with order details
    cy.get('[role="dialog"]').should('be.visible');
    cy.contains('Order Summary').should('be.visible');
    cy.contains('Status Timeline').should('be.visible');

    // 6. Close drawer with Escape
    cy.get('body').type('{esc}');
    cy.get('[role="dialog"]').should('not.exist');
  });

  it('switches role to supervisor and sees additional actions', () => {
    cy.visit('/');

    // Default: agent — no Hold/Cancel actions in drawer
    cy.get('select').first().select('supervisor');

    // Supervisor KPI shows SLA Breach Rate
    cy.contains('SLA Breach Rate').should('be.visible');

    // Supervisor widget appears
    cy.contains('Supervisor View Active').should('be.visible');
  });

  it('URL state is shareable — filter persists on reload', () => {
    cy.visit('/?status=Held');
    cy.get('[role="row"]').each(($row) => {
      cy.wrap($row).should('contain.text', 'Held');
    });
  });
});
