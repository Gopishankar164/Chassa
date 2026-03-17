import React from 'react';

const SystemSettings = () => (
  <div>
    <h2 className="page-title">System Settings</h2>
    <form>
      <div className="form-group">
        <label className="form-label">Site Name</label>
        <input className="form-input" type="text" placeholder="Enter site name" />
      </div>
      <div className="form-group">
        <label className="form-label">Admin Email</label>
        <input className="form-input" type="email" placeholder="Enter admin email" />
      </div>
      <button className="btn btn-primary" type="submit">Save Settings</button>
    </form>
  </div>
);

export default SystemSettings;