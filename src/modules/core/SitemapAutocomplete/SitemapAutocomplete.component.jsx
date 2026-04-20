import { chevronDown, search } from '@/assets/icons';
import Icon from '@/modules/core/Icon';
import { Autocomplete, Box, Button, CircularProgress, createFilterOptions, InputAdornment, Paper, TextField, Typography } from '@mui/material';
import classNames from 'classnames';
import { forwardRef, useEffect, useRef, useState } from 'react';
import style from './SitemapAutocomplete.module.scss';

const generateSitemapOptions = (tree, level = 0) => {
  if (!tree) return [];
  return tree.flatMap(item => [
    {
      id: item.id,
      label: item.name,
      level,
      hasChildren: !!(item.children && item.children.length),
      notClickable: item.not_clickable || item.disabled
    },
    ...(item.children ? generateSitemapOptions(item.children, level + 1) : [])
  ]);
};

const SitemapAutocomplete = forwardRef((props, ref) => {
  const {
    id = '',
    sitemap = [],
    onValueUpdate = () => {},
    placeholder = '',
    leftIcon = true,
    rightIcon = false,
    value,
    error = '',
    environmentType,
    disabled = false,
    autoFocus = false,
    onAutocompleteBlurNext = () => {},
    onAutocompleteBlurPrev = () => {}
  } = props;

  const wrapperRef = useRef(null);
  const paperRef = useRef(null);
  const addUrlBtnRef = useRef(null);
  const addUrlInputRef = useRef(null);
  const saveBtnInternalRef = useRef(null);
  const inputElRef = useRef(null);
  const cursorPosRef = useRef(0);
  const filterOptions = createFilterOptions();

  const [inputValue, setInputValue] = useState('');
  const [autocompleteValue, setAutocompleteValue] = useState(null);
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const [isAddUrlMode, setIsAddUrlMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setAutocompleteValue(value || '');
  }, [value]);

  useEffect(() => {
    if (!isAutocompleteOpen) return;
    const handleGlobalMouseDown = (e) => {
      if (paperRef.current?.contains(e.target) || wrapperRef.current?.contains(e.target)) {
        return;
      }
      setIsAutocompleteOpen(false);
      setIsAddUrlMode(false);
    };
    document.addEventListener('mousedown', handleGlobalMouseDown);
    return () => document.removeEventListener('mousedown', handleGlobalMouseDown);
  }, [isAutocompleteOpen]);

  useEffect(() => {
    if (addUrlInputRef.current) {
      addUrlInputRef.current.setSelectionRange(cursorPosRef.current, cursorPosRef.current);
    }
  });

  const handleSubmitUrl = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();

    try {
      setIsSubmitting(true);
      let url = customUrl.trim();
      const page = await window.api.environment.createPage({
        id: environmentType,
        url
      });
      const newPageValue = { id: page.id, label: page.name };
      setAutocompleteValue(newPageValue.label);
      setInputValue(newPageValue.label);
      onValueUpdate(newPageValue);
      setCustomUrl('');
      setIsAddUrlMode(false);
      setIsAutocompleteOpen(false);
      setErrorMessage('');
    } catch (err) {
      const formattedError = err?.message?.split('Error: ').pop() || 'Failed to create page';
      setErrorMessage(formattedError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key !== 'Tab' || !isAutocompleteOpen) return;
    if (!e.shiftKey) {
      if (isAddUrlMode && addUrlInputRef.current) {
        e.preventDefault();
        addUrlInputRef.current.focus();
        return;
      }
      if (addUrlBtnRef.current) {
        e.preventDefault();
        addUrlBtnRef.current.focus();
      }
      return;
    }

    if (e.shiftKey) {
      e.preventDefault();
      setIsAutocompleteOpen(false);
      setIsAddUrlMode(false);
      if (onAutocompleteBlurPrev) {
        setTimeout(() => onAutocompleteBlurPrev(), 0);
      }
    }
  };

  const handleAddUrlBtnKeyDown = (e) => {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      e.preventDefault();
      if (inputElRef.current) {
        inputElRef.current.focus();
        return;
      }
    }
    if (!e.shiftKey) {
      e.preventDefault();
      setIsAutocompleteOpen(false);
      setIsAddUrlMode(false);
      if (onAutocompleteBlurNext) {
        setTimeout(() => onAutocompleteBlurNext(), 0);
      }
    }
  };

  return (
    <div ref={wrapperRef} style={{ width: '100%' }}>
      <Autocomplete
        id={id}
        fullWidth
        options={generateSitemapOptions(sitemap)}
        filterOptions={(options, state) => {
          const filtered = filterOptions(options, state);
          return filtered.length > 0 ? filtered : [{ __empty: true }];
        }}
        autoHighlight
        freeSolo
        disableCloseOnSelect
        className={style.autocomplete}
        autoFocus={autoFocus}
        getOptionLabel={option => (typeof option === 'string' ? option : option?.label || '')}
        disabled={disabled}
        open={isAutocompleteOpen}
        onFocus={() => setIsAutocompleteOpen(true)}
        onOpen={() => setIsAutocompleteOpen(true)}
        onClose={(event, reason) => {
          if (reason === 'escape' || reason === 'toggleInput' || reason === 'popperClick' || reason === 'clear') {
            setIsAutocompleteOpen(false);
            setIsAddUrlMode(false);
          }
        }}
        onBlur={(e) => {
          setTimeout(() => {
            const activeEl = document.activeElement;
            if (paperRef.current && !paperRef.current.contains(activeEl)) {
              setIsAutocompleteOpen(false);
              setIsAddUrlMode(false);

              if (onAutocompleteBlurNext) {
                onAutocompleteBlurNext();
              }
            }
          }, 100);
        }}
        value={autocompleteValue || ''}
        inputValue={inputValue}
        onInputChange={(e, newInputValue, reason) => {
          setInputValue(newInputValue);
          if (reason === 'input') setIsAutocompleteOpen(true);
        }}
        onChange={(e, newValue) => {
          setAutocompleteValue(newValue);
          onValueUpdate(newValue);
          setIsAutocompleteOpen(false);
          setIsAddUrlMode(false);
        }}
        renderInput={params => (
          <TextField
            {...params}
            inputRef={(el) => {
              inputElRef.current = el;
              if (typeof ref === 'function') {
                ref(el);
              } else if (ref) {
                ref.current = el;
              }
            }}
            placeholder={placeholder || 'Search'}
            variant='outlined'
            error={Boolean(error)}
            helperText={error}
            className={style.autocompleteTextField}
            onClick={!disabled ? () => setIsAutocompleteOpen(true) : undefined}
            onKeyDown={handleInputKeyDown}
            sx={{
              '& .MuiOutlinedInput-notchedOutline': {
                borderRadius: '8px'
              }
            }}
            slotProps={{
              input: {
                ...params.InputProps,
                startAdornment: leftIcon
                  ? (
                    <InputAdornment sx={{ mr: 0 }} position='start'>
                      <Icon className={classNames('clym-contrast-exclude', style.icon)} icon={search} />
                    </InputAdornment>
                    )
                  : null,
                endAdornment:
                  !disabled && rightIcon
                    ? (
                      <InputAdornment sx={{ mr: 0 }} position='end'>
                        <Icon className={classNames('clym-contrast-exclude', style.icon)} icon={chevronDown} />
                      </InputAdornment>
                      )
                    : null
              }
            }}
          />
        )}
        getOptionDisabled={option => option.notClickable}
        renderOption={(props, option) => {
          if (option.__empty) return null;
          const padding = `${(option.level + 1) * 12}px`;
          const fontWeight = option.level === 0 || option.hasChildren ? '500' : 'normal';
          const notClickable = option.notClickable;

          return (
            <li
              {...props}
              onClick={notClickable ? () => {} : props.onClick}
              key={option.id}
              style={{ paddingLeft: padding, fontWeight }}
              className={classNames(props.className, style.autocompleteOption, { [style.disabled]: notClickable })}
            >
              <Typography>{option.label}</Typography>
            </li>
          );
        }}
        PaperComponent={({ children }) => {
          return (
            <Paper ref={paperRef} className={style.paper}>
              {children}

              <Box className={style.customInputContainer}>
                {!isAddUrlMode
                  ? (
                    <Button
                      color='primary'
                      fullWidth
                      variant='outlined'
                      className={style.addPageButton}
                      ref={addUrlBtnRef}
                      onClick={() => {
                        setIsAddUrlMode(true);
                        setTimeout(() => addUrlInputRef.current?.focus(), 0);
                      }}
                      onKeyDown={handleAddUrlBtnKeyDown}
                    >
                      <Typography>+ Add URL</Typography>
                    </Button>
                    )
                  : (
                    <Box component='form' onSubmit={handleSubmitUrl}>
                      <Box className={style.form}>
                        <TextField
                          className={classNames(style.textField, { [style.error]: errorMessage })}
                          autoFocus
                          value={customUrl}
                          inputRef={addUrlInputRef}
                          onChange={(e) => {
                            cursorPosRef.current = e.target.selectionStart;
                            setErrorMessage('');
                            setCustomUrl(e.target.value);
                          }}
                          onKeyDown={(e) => {
                            if (e.key !== 'Tab') return;
                            if (e.shiftKey) {
                              e.preventDefault();
                              inputElRef.current?.focus();
                              return;
                            }
                            if (!e.shiftKey) {
                              e.preventDefault();
                              saveBtnInternalRef.current?.focus();
                            }
                          }}
                          fullWidth
                          placeholder='http://www.'
                        />
                        <Button
                          onClick={handleSubmitUrl}
                          ref={saveBtnInternalRef}
                          disabled={isSubmitting}
                          onKeyDown={(e) => {
                            if (e.key !== 'Tab') return;
                            if (e.shiftKey) {
                              e.preventDefault();
                              addUrlInputRef.current?.focus();
                              return;
                            }
                            if (!e.shiftKey) {
                              e.preventDefault();
                              setIsAutocompleteOpen(false);
                              setIsAddUrlMode(false);
                              if (onAutocompleteBlurNext) {
                                setTimeout(() => onAutocompleteBlurNext(), 0);
                              }
                            }
                          }}
                        >
                          {isSubmitting && <CircularProgress className={style.progressSpinner} color='inherit' size={16} />}
                          <Typography>Save</Typography>
                        </Button>
                      </Box>
                      {errorMessage && (
                        <Box>
                          <Typography variant='caption' className={style.errorMessage}>
                            {errorMessage}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    )}
              </Box>
            </Paper>
          );
        }}
      />
    </div>
  );
});

SitemapAutocomplete.displayName = 'SitemapAutocomplete';

export default SitemapAutocomplete;
