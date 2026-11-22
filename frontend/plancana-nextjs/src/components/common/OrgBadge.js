'use client';

import { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import { orgService } from '../../services/api';

const OrgBadge = ({ className = '' }) => {
  const [org, setOrg] = useState(null);

  useEffect(() => {
    orgService.getOrgInfo()
      .then(res => setOrg(res.data.organization))
      .catch(() => {}); // silently ignore (platform admins have no org)
  }, []);

  if (!org) return null;

  return (
    <span className={`inline-flex items-center gap-1.5 bg-white/20 text-white text-sm font-medium px-3 py-1 rounded-full ${className}`}>
      <Building2 className="h-3.5 w-3.5" />
      {org.name}
    </span>
  );
};

export default OrgBadge;
