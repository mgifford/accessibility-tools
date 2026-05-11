import { chevronDown } from '@/assets/icons';
import IconButton from '@/modules/core/IconButton';
import { Box, Button, ButtonGroup, ClickAwayListener, Grow, MenuItem, MenuList, Paper, Popper, Typography } from '@mui/material';
import classNames from 'classnames';
import { useEffect, useRef, useState } from 'react';
import style from './SplitButton.module.scss';

export default function SplitButton({ options = [], className = '', disabled = false }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  const selectedOption = options[selectedIndex];

  const isAllDisabled = options.every(o => o.disabled);

  const handleMainClick = () => {
    selectedOption?.onClick?.();
  };

  const handleMenuItemClick = (index) => {
    setSelectedIndex(index);
    setOpen(false);
  };

  const handleToggle = () => setOpen(prev => !prev);

  const handleClose = (event) => {
    if (anchorRef.current?.contains(event.target)) return;
    setOpen(false);
  };

  useEffect(() => {
    const handleWindowBlur = () => setOpen(false);
    window.addEventListener('blur', handleWindowBlur);
    return () => window.removeEventListener('blur', handleWindowBlur);
  }, []);

  return (
    <Box className={classNames(style.root, className)}>
      <ButtonGroup ref={anchorRef} variant='outlined' aria-label='split button' className={style.buttonGroup}>
        <Button onClick={handleMainClick} className={style.actionBtn} disabled={isAllDisabled || disabled}>
          <Typography>
            {selectedOption?.label ?? ''}
          </Typography>
        </Button>
        <IconButton
          Icon={chevronDown}
          size='small'
          aria-label='more options'
          aria-controls={open ? 'split-button-menu' : undefined}
          aria-expanded={open ? 'true' : undefined}
          aria-haspopup='menu'
          onClick={handleToggle}
          className={style.iconBtn}
          disabled={isAllDisabled || disabled}
        />
      </ButtonGroup>

      <Popper
        open={open}
        anchorEl={anchorRef.current}
        placement='bottom-start'
        transition
        disablePortal
        style={{ width: anchorRef.current?.offsetWidth, zIndex: 1 }}
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps}>
            <Paper className={style.paper}>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList id='split-button-menu' autoFocusItem className={style.menuList}>
                  {options.map((option, index) => (
                    <MenuItem
                      key={option.label}
                      selected={index === selectedIndex}
                      onClick={() => handleMenuItemClick(index)}
                      className={style.menuItem}
                      disabled={option.disabled}
                    >
                      {option.label}
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </Box>
  );
}
