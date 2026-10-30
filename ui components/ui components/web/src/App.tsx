import { useState } from 'react';
import { Container, Stack, Typography, Box, Grid, Button } from '@mui/material';
import {
  Modal,
  CreateForm,
  EditForm,
  ViewModal,
  DeleteAlert,
  AutocompleteField,
  DropdownList,
  NumberField,
  StatTile,
  ConversionFunnel,
  PayoutQueue,
  Label,
  CommonTable,
  type Field,
  type ViewSection,
  type FieldOption,
  type StatTileTrend,
  type ConversionFunnelStage,
  type PayoutQueueItem,
} from '@heaven/ui-components';

function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Create Form Fields
  const createFields: Field[] = [
    { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Enter name' },
    { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'Enter email' },
    { name: 'age', label: 'Age', type: 'number', required: true, min: 18, max: 100 },
    { name: 'role', label: 'Role', type: 'select', required: true, options: [{ value: 'admin', label: 'Admin' }, { value: 'user', label: 'User' }] },
    { name: 'bio', label: 'Bio', type: 'textarea', rows: 3, hint: 'Tell us about yourself' },
    { name: 'active', label: 'Active Status', type: 'switch', switchDescription: 'Enable user account' },
  ];

  // View Modal Sections
  const viewSections: ViewSection[] = [
    {
      title: 'Personal Information',
      fields: [
        { label: 'Name', value: 'John Doe', type: 'text' },
        { label: 'Email', value: 'john@example.com', type: 'text' },
        { label: 'Age', value: '30', type: 'text' },
        { label: 'Active', value: true, type: 'boolean' },
      ],
    },
    {
      title: 'Account Details',
      fields: [
        { label: 'Role', value: 'Admin', type: 'status', tone: 'primary' },
        { label: 'Status', value: 'Active', type: 'status', tone: 'success' },
        { label: 'Created At', value: '2024-01-15', type: 'text' },
      ],
    },
  ];

  // Stat Tile Data
  const trend: StatTileTrend = { direction: 'up', label: '+12% from last month' };

  // Conversion Funnel Data
  const funnelStages: ConversionFunnelStage[] = [
    { id: '1', label: 'Leads Generated', value: 1000, color: 'success.light' },
    { id: '2', label: 'Qualified Leads', value: 750, color: 'success.light' },
    { id: '3', label: 'Proposals Sent', value: 500, color: 'success.light' },
    { id: '4', label: 'Negotiations', value: 300, color: 'warning.light' },
    { id: '5', label: 'Closed Deals', value: 150, color: 'warning.light' },
  ];

  // Payout Queue Data
  const payouts: PayoutQueueItem[] = [
    {
      requestID: 1,
      leadName: 'Rahul Sharma',
      sarthiName: 'Amit Kumar',
      capacity: '5kW',
      requestedPaymentMode: 'Bank Transfer',
      amount: 25000,
    },
    {
      requestID: 2,
      leadName: 'Priya Patel',
      sarthiName: 'Suresh Singh',
      capacity: '3kW',
      requestedPaymentMode: 'UPI',
      amount: 15000,
    },
  ];

  // Table Data
  const tableColumns = [
    { id: 'name', label: 'Name', align: 'left', sortable: true },
    { id: 'email', label: 'Email', align: 'left' },
    { id: 'role', label: 'Role', align: 'center' },
    { id: 'status', label: 'Status', align: 'center' },
  ];

  const tableData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Active' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User', status: 'Inactive' },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Container maxWidth="xl">
        <Typography variant="h3" component="h1" sx={{ mb: 4, fontWeight: 700 }}>
          Heaven UI Components - Demo
        </Typography>

        <Grid container spacing={4}>
          {/* Stat Tiles */}
          <Grid item xs={12} md={4}>
            <StatTile
              title="Total Users"
              value="12,345"
              icon={<span>👥</span>}
              trend={trend}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatTile
              title="Revenue"
              value="₹45,678"
              icon={<span>💰</span>}
              trend={{ direction: 'up', label: '+8% from last month' }}
              color="success"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatTile
              title="Conversion Rate"
              value="24.5%"
              icon={<span>📈</span>}
              trend={{ direction: 'down', label: '-3% from last month' }}
              color="warning"
            />
          </Grid>

          {/* Labels */}
          <Grid item xs={12}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              Labels
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Label color="default">Default</Label>
              <Label color="primary">Primary</Label>
              <Label color="success">Success</Label>
              <Label color="warning">Warning</Label>
              <Label color="error">Error</Label>
              <Label color="info">Info</Label>
              <Label variant="filled" color="primary">
                Filled
              </Label>
              <Label variant="outlined" color="success">
                Outlined
              </Label>
            </Stack>
          </Grid>

          {/* Buttons to Open Modals */}
          <Grid item xs={12}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              Modals
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button variant="contained" onClick={() => setModalOpen(true)}>
                Open Create Form Modal
              </Button>
              <Button variant="contained" color="secondary" onClick={() => setViewModalOpen(true)}>
                Open View Modal
              </Button>
              <Button variant="contained" color="error" onClick={() => setDeleteModalOpen(true)}>
                Open Delete Modal
              </Button>
            </Stack>
          </Grid>

          {/* Conversion Funnel */}
          <Grid item xs={12} md={6}>
            <ConversionFunnel stages={funnelStages} total={1000} />
          </Grid>

          {/* Payout Queue */}
          <Grid item xs={12} md={6}>
            <PayoutQueue payouts={payouts} />
          </Grid>

          {/* Table */}
          <Grid item xs={12}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              Data Table
            </Typography>
            <CommonTable columns={tableColumns} data={tableData} maxHeight={400} />
          </Grid>
        </Grid>
      </Container>

      {/* Create Form Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create New User" maxWidth={600}>
        <CreateForm
          fields={createFields}
          onSubmit={(values, files) => {
            console.log('Form submitted:', values, files);
            setModalOpen(false);
          }}
          onClose={() => setModalOpen(false)}
        />
      </Modal>

      {/* View Modal */}
      <ViewModal open={viewModalOpen} onClose={() => setViewModalOpen(false)} title="User Details" sections={viewSections} />

      {/* Delete Modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirm Delete" maxWidth={500}>
        <DeleteAlert
          alertMsg="Are you sure you want to delete this item? This action cannot be undone."
          onDelete={() => {
            console.log('Item deleted');
            setDeleteModalOpen(false);
          }}
          onClose={() => setDeleteModalOpen(false)}
        />
      </Modal>
    </Box>
  );
}

export default App;
