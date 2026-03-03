import { plus, trash2 } from '@/assets/icons';
import Icon from '@/modules/core/Icon';
import { useProjectTestFormStore } from '@/stores/useProjectTestFormStore';
import { Button, IconButton, Typography } from '@mui/material';
import classNames from 'classnames';
import { useEffect, useRef, useState } from 'react';
import styles from './ProjectTest.module.scss';
import SitemapAutocomplete from '@/modules/core/SitemapAutocomplete';

const getFilteredSitemap = (sitemap, structuredPages = [], randomPages = []) => {
  if (!sitemap || sitemap.length === 0) return [];
  const filterChildren = (sitemapArray) => {
    return sitemapArray
      .map((item) => {
        const isItemInStructuredPages = structuredPages.some(page => page?.id && item?.id && page.id === item.id);
        const isItemInRandomPages = randomPages?.some(page => page?.id && item?.id && page.id === item.id);
        const isItemIncluded = isItemInRandomPages || isItemInStructuredPages;
        item.isSelected = isItemIncluded;
        const filteredChildren = item.children ? filterChildren(item.children) : [];
        const hasChildren = filteredChildren.length > 0;
        item.hasChildren = hasChildren;
        if (isItemIncluded && hasChildren) {
          item.disabled = true;
        } else {
          item.disabled = false;
        }
        return item;
      })
      .filter((item) => {
        if (!item) return false;
        if (item.isSelected && item.hasChildren) return true;
        return !item.isSelected && (item.hasChildren || !item.children);
      })
      .map(item => ({
        ...item,
        children: item.children ? filterChildren(item.children) : []
      }));
  };
  return filterChildren(sitemap || []);
};

const SitemapForm = ({ pagesType = '', onSiteMapUpdate, addPage, removePage }) => {
  const { environmentType, structuredPages, randomPages, errors } = useProjectTestFormStore();
  const pages = pagesType === 'structured' ? structuredPages : pagesType === 'random' ? randomPages : [];
  const pagesField = pagesType === 'structured' ? 'structuredPages' : 'randomPages';

  const addPageBtnRef = useRef(null);
  const autocompleteRefs = useRef([]);
  const deleteBtnRefs = useRef([]);
  const prevPagesLengthRef = useRef(pages.length);

  const [sitemap, setSitemap] = useState([]);
  const [filteredSitemap, setFilteredSitemap] = useState([]);

  const handleNextFocus = (index) => {
    const deleteBtn = deleteBtnRefs.current[index];
    if (deleteBtn) {
      deleteBtn.focus();
      return;
    }
    const next = autocompleteRefs.current[index + 1];
    if (next) {
      next.focus();
      return;
    }
    if (!addPageBtnRef.current?.disabled) {
      addPageBtnRef.current?.focus();
    }
  };

  const handlePrevFocus = (index) => {
    const prevDeleteBtn = deleteBtnRefs.current[index - 1];
    if (prevDeleteBtn) {
      prevDeleteBtn.focus();
      return;
    }
    const prevAutocomplete = autocompleteRefs.current[index - 1];
    if (prevAutocomplete) {
      prevAutocomplete.focus();
      return;
    }
  };

  useEffect(() => {
    const getSitemap = async (envId) => {
      const envSitemap = await window.api.environment.getSitemap({ environment_id: envId });
      setSitemap(envSitemap);
    };
    if (environmentType) {
      getSitemap(environmentType);
    }
  }, [environmentType]);

  useEffect(() => {
    setFilteredSitemap(getFilteredSitemap(sitemap, structuredPages, randomPages));
  }, [sitemap, structuredPages, randomPages]);

  useEffect(() => {
    const prevLength = prevPagesLengthRef.current;
    if (pages.length > prevLength) {
      setTimeout(() => {
        const lastAutocomplete = autocompleteRefs.current[pages.length - 1];
        lastAutocomplete?.focus();
      }, 0);
    }
    prevPagesLengthRef.current = pages.length;
  }, [pages.length]);

  if (pages.length === 0) return;

  return (
    <>
      {pages.map((page, index) => {
        const shouldAutoFocus
          = (!page?.id) && (index === 0 || index === pages.length - 1);
        return (
          <div key={index} className={styles.pageRow}>
            <div className={styles.selectContainer}>
              <Typography variant='body1'>{index + 1}</Typography>
              <SitemapAutocomplete
                ref={el => (autocompleteRefs.current[index] = el)}
                id={`sitemap-autocomplete-${index}`}
                sitemap={filteredSitemap}
                value={page}
                environmentType={environmentType}
                onValueUpdate={newValue => onSiteMapUpdate(newValue, index)}
                placeholder='Select page'
                error={errors?.[pagesField]?.[index]}
                leftIcon={false}
                rightIcon
                autoFocus={shouldAutoFocus}
                onAutocompleteBlurNext={() => {
                  handleNextFocus(index);
                }}
                onAutocompleteBlurPrev={() => {
                  handlePrevFocus(index);
                }}
              />
              {pages.length > 1 && index !== 0 && (
                <IconButton
                  ref={el => (deleteBtnRefs.current[index] = el)}
                  onClick={() => {
                    removePage(index);
                    setTimeout(() => {
                      addPageBtnRef.current?.focus();
                    }, 0);
                  }}
                  onKeyDown={(e) => {
                    if (e.key !== 'Tab' || e.shiftKey) return;
                    e.preventDefault();
                    const next = autocompleteRefs.current[index + 1];
                    if (next) {
                      next.focus();
                      return;
                    }
                    if (!addPageBtnRef.current?.disabled) {
                      addPageBtnRef.current?.focus();
                    }
                  }}
                  aria-label={`Remove page ${index + 1}`}
                  className={styles.deleteButton}
                >
                  <Icon className={classNames('clym-contrast-exclude', styles.icon)} icon={trash2} />
                </IconButton>
              )}
            </div>
          </div>
        );
      })}
      { pages[pages.length - 1].id && (
        <Button ref={addPageBtnRef} variant='text' className={styles.addPageButton} onClick={addPage}>
          <Icon className={classNames('clym-contrast-exclude', styles.icon)} icon={plus} />
          <Typography variant='body2'>Add another page</Typography>
        </Button>
      )}
    </>
  );
};
export default SitemapForm;
