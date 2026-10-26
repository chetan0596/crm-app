import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Typography,
} from "@mui/material";

const cardSx = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 3,
  boxShadow: '0 8px 24px rgba(28,37,46,.05)',
};

const iconByAction = {
  create: { icon: 'fas fa-plus', color: '#22c55e' },
  update: { icon: 'fas fa-edit', color: '#00b8d9' },
  delete: { icon: 'fas fa-trash', color: '#ff5630' },
};

export default function LeadCategoryActivity() {

  const { id } = useParams();
  const nav = useNavigate();

  const logs = [
    {
      action: "create",
      text: "Category created",
      user: "Admin",
      time: "2026-02-05 10:22"
    },
    {
      action: "update",
      text: "Name changed: Cold → Warm",
      user: "Admin",
      time: "2026-02-05 11:10"
    },
    {
      action: "update",
      text: "Status updated",
      user: "Manager",
      time: "2026-02-06 09:05"
    },
    {
      action: "delete",
      text: "Category removed",
      user: "Admin",
      time: "2026-02-06 12:30"
    }
  ];

  const icon = (a) => iconByAction[a] || { icon: 'fas fa-circle', color: '#637381' };

  return (
    <Box>
      <Card sx={cardSx}>
        <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 700 }}>
            Category Activity — ID #{id}
          </Typography>
          <Button
            variant="outlined"
            onClick={() => nav(-1)}
            startIcon={<i className="fas fa-arrow-left" aria-hidden="true" />}
          >
            Back
          </Button>
        </CardContent>

        <Divider />

        <Box sx={{ px: 3, py: 3 }}>
          {logs.map((l, i) => {
            const meta = icon(l.action);
            return (
              <Box key={i} sx={{ display: 'flex', gap: 2, position: 'relative', pb: i === logs.length - 1 ? 0 : 3 }}>
                {i !== logs.length - 1 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 17,
                      top: 36,
                      bottom: 0,
                      width: 2,
                      bgcolor: 'divider',
                    }}
                  />
                )}
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    bgcolor: meta.color,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: 13,
                  }}
                >
                  <i className={meta.icon} aria-hidden="true" />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: .75 }}>
                    <i className="far fa-clock" aria-hidden="true" /> {l.time}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ color: 'text.primary', fontWeight: 700, mt: .25 }}>
                    {l.action.toUpperCase()}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.primary', mt: .25 }}>
                    {l.text}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    by {l.user}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Card>
    </Box>
  );
}
