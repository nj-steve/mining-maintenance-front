/** The global namespace for the app */
declare namespace App {
  /** Theme namespace */
  namespace Theme {
    type ColorPaletteNumber = import('@sa/color').ColorPaletteNumber;

    /** Theme setting */
    interface ThemeSetting {
      /** Theme scheme */
      themeScheme: UnionKey.ThemeScheme;
      /** grayscale mode */
      grayscale: boolean;
      /** colour weakness mode */
      colourWeakness: boolean;
      /** Whether to recommend color */
      recommendColor: boolean;
      /** Theme color */
      themeColor: string;
      /** Other color */
      otherColor: OtherColor;
      /** Whether info color is followed by the primary color */
      isInfoFollowPrimary: boolean;
      /** Reset cache strategy */
      resetCacheStrategy: UnionKey.ResetCacheStrategy;
      /** Layout */
      layout: {
        /** Layout mode */
        mode: UnionKey.ThemeLayoutMode;
        /** Scroll mode */
        scrollMode: UnionKey.ThemeScrollMode;
        /**
         * Whether to reverse the horizontal mix
         *
         * if true, the vertical child level menus in left and horizontal first level menus in top
         */
        reverseHorizontalMix: boolean;
      };
      /** Page */
      page: {
        /** Whether to show the page transition */
        animate: boolean;
        /** Page animate mode */
        animateMode: UnionKey.ThemePageAnimateMode;
      };
      /** Header */
      header: {
        /** Header height */
        height: number;
        /** Header breadcrumb */
        breadcrumb: {
          /** Whether to show the breadcrumb */
          visible: boolean;
          /** Whether to show the breadcrumb icon */
          showIcon: boolean;
        };
        /** Multilingual */
        multilingual: {
          /** Whether to show the multilingual */
          visible: boolean;
        };
        globalSearch: {
          /** Whether to show the GlobalSearch */
          visible: boolean;
        };
      };
      /** Tab */
      tab: {
        /** Whether to show the tab */
        visible: boolean;
        /**
         * Whether to cache the tab
         *
         * If cache, the tabs will get from the local storage when the page is refreshed
         */
        cache: boolean;
        /** Tab height */
        height: number;
        /** Tab mode */
        mode: UnionKey.ThemeTabMode;
      };
      /** Fixed header and tab */
      fixedHeaderAndTab: boolean;
      /** Sider */
      sider: {
        /** Inverted sider */
        inverted: boolean;
        /** Sider width */
        width: number;
        /** Collapsed sider width */
        collapsedWidth: number;
        /** Sider width when the layout is 'vertical-mix' or 'horizontal-mix' */
        mixWidth: number;
        /** Collapsed sider width when the layout is 'vertical-mix' or 'horizontal-mix' */
        mixCollapsedWidth: number;
        /** Child menu width when the layout is 'vertical-mix' or 'horizontal-mix' */
        mixChildMenuWidth: number;
      };
      /** Footer */
      footer: {
        /** Whether to show the footer */
        visible: boolean;
        /** Whether fixed the footer */
        fixed: boolean;
        /** Footer height */
        height: number;
        /** Whether float the footer to the right when the layout is 'horizontal-mix' */
        right: boolean;
      };
      /** Watermark */
      watermark: {
        /** Whether to show the watermark */
        visible: boolean;
        /** Watermark text */
        text: string;
        /** Whether to use user name as watermark text */
        enableUserName: boolean;
      };
      /** define some theme settings tokens, will transform to css variables */
      tokens: {
        light: ThemeSettingToken;
        dark?: {
          [K in keyof ThemeSettingToken]?: Partial<ThemeSettingToken[K]>;
        };
      };
    }

    interface OtherColor {
      info: string;
      success: string;
      warning: string;
      error: string;
    }

    interface ThemeColor extends OtherColor {
      primary: string;
    }

    type ThemeColorKey = keyof ThemeColor;

    type ThemePaletteColor = {
      [key in ThemeColorKey | `${ThemeColorKey}-${ColorPaletteNumber}`]: string;
    };

    type BaseToken = Record<string, Record<string, string>>;

    interface ThemeSettingTokenColor {
      /** the progress bar color, if not set, will use the primary color */
      nprogress?: string;
      container: string;
      layout: string;
      inverted: string;
      'base-text': string;
    }

    interface ThemeSettingTokenBoxShadow {
      header: string;
      sider: string;
      tab: string;
    }

    interface ThemeSettingToken {
      colors: ThemeSettingTokenColor;
      boxShadow: ThemeSettingTokenBoxShadow;
    }

    type ThemeTokenColor = ThemePaletteColor & ThemeSettingTokenColor;

    /** Theme token CSS variables */
    type ThemeTokenCSSVars = {
      colors: ThemeTokenColor & { [key: string]: string };
      boxShadow: ThemeSettingTokenBoxShadow & { [key: string]: string };
    };
  }

  /** Global namespace */
  namespace Global {
    type VNode = import('vue').VNode;
    type RouteLocationNormalizedLoaded = import('vue-router').RouteLocationNormalizedLoaded;
    type RouteKey = import('@elegant-router/types').RouteKey;
    type RouteMap = import('@elegant-router/types').RouteMap;
    type RoutePath = import('@elegant-router/types').RoutePath;
    type LastLevelRouteKey = import('@elegant-router/types').LastLevelRouteKey;

    /** The router push options */
    type RouterPushOptions = {
      query?: Record<string, string>;
      params?: Record<string, string>;
    };

    /** The global header props */
    interface HeaderProps {
      /** Whether to show the logo */
      showLogo?: boolean;
      /** Whether to show the menu toggler */
      showMenuToggler?: boolean;
      /** Whether to show the menu */
      showMenu?: boolean;
    }

    /** The global menu */
    type Menu = {
      /**
       * The menu key
       *
       * Equal to the route key
       */
      key: string;
      /** The menu label */
      label: string;
      /** The menu i18n key */
      i18nKey?: I18n.I18nKey | null;
      /** The route key */
      routeKey: RouteKey;
      /** The route path */
      routePath: RoutePath;
      /** The menu icon */
      icon?: () => VNode;
      /** The menu children */
      children?: Menu[];
    };

    type Breadcrumb = Omit<Menu, 'children'> & {
      options?: Breadcrumb[];
    };

    /** Tab route */
    type TabRoute = Pick<RouteLocationNormalizedLoaded, 'name' | 'path' | 'meta'> &
      Partial<Pick<RouteLocationNormalizedLoaded, 'fullPath' | 'query' | 'matched'>>;

    /** The global tab */
    type Tab = {
      /** The tab id */
      id: string;
      /** The tab label */
      label: string;
      /**
       * The new tab label
       *
       * If set, the tab label will be replaced by this value
       */
      newLabel?: string;
      /**
       * The old tab label
       *
       * when reset the tab label, the tab label will be replaced by this value
       */
      oldLabel?: string;
      /** The tab route key */
      routeKey: LastLevelRouteKey;
      /** The tab route path */
      routePath: RouteMap[LastLevelRouteKey];
      /** The tab route full path */
      fullPath: string;
      /** The tab fixed index */
      fixedIndex?: number | null;
      /**
       * Tab icon
       *
       * Iconify icon
       */
      icon?: string;
      /**
       * Tab local icon
       *
       * Local icon
       */
      localIcon?: string;
      /** I18n key */
      i18nKey?: I18n.I18nKey | null;
    };

    /** Form rule */
    type FormRule = import('naive-ui').FormItemRule;

    /** The global dropdown key */
    type DropdownKey = 'closeCurrent' | 'closeOther' | 'closeLeft' | 'closeRight' | 'closeAll';
  }

  /**
   * I18n namespace
   *
   * Locales type
   */
  namespace I18n {
    type RouteKey = import('@elegant-router/types').RouteKey;

    type LangType = 'en-US' | 'zh-CN';

    type LangOption = {
      label: string;
      key: LangType;
    };

    type I18nRouteKey = Exclude<RouteKey, 'root' | 'not-found'>;

    type FormMsg = {
      required: string;
      invalid: string;
    };

    type Schema = {
      system: {
        title: string;
        updateTitle: string;
        updateContent: string;
        updateConfirm: string;
        updateCancel: string;
      };
      common: {
        helpDoc: string;
        action: string;
        add: string;
        addSuccess: string;
        backToHome: string;
        batchDelete: string;
        cancel: string;
        close: string;
        check: string;
        expandColumn: string;
        columnSetting: string;
        config: string;
        confirm: string;
        delete: string;
        deleteSuccess: string;
        confirmDelete: string;
        edit: string;
        warning: string;
        error: string;
        index: string;
        keywordSearch: string;
        logout: string;
        logoutConfirm: string;
        lookForward: string;
        modify: string;
        modifySuccess: string;
        noData: string;
        operate: string;
        pleaseCheckValue: string;
        refresh: string;
        reset: string;
        search: string;
        switch: string;
        tip: string;
        trigger: string;
        update: string;
        updateSuccess: string;
        userCenter: string;
        yesOrNo: {
          yes: string;
          no: string;
        };
      };
      business: {
        enableStatus: {
          active: string;
          inactive: string;
        };
        siteStatus: {
          none: string;
          onsite: string;
          sendRepair: string;
          onsiteAndSendRepair: string;
        };
        repairMethod: {
          onsite: string;
          sendRepair: string;
          exchange: string;
        };
        repairType: {
          wholeMachine: string;
          hashBoard: string;
        };
        repairResult: {
          pending: string;
          unrepaired: string;
          repaired: string;
          scrapped: string;
        };
        tagMap: {
          onShelf: string;
          repairing: string;
          scrapped: string;
          offShelf: string;
        };
        userStatus: {
          active: string;
          leave: string;
          disabled: string;
        };
        role: {
          admin: string;
          afterSales: string;
          operation: string;
          maintenance: string;
          readOnly: string;
        };
        warrantyStatus: {
          inWarranty: string;
          outOfWarranty: string;
          noWarranty: string;
          expired: string;
        };
      };
      request: {
        logout: string;
        logoutMsg: string;
        logoutWithModal: string;
        logoutWithModalMsg: string;
        refreshToken: string;
        tokenExpired: string;
      };
      theme: {
        themeSchema: { title: string } & Record<UnionKey.ThemeScheme, string>;
        grayscale: string;
        colourWeakness: string;
        layoutMode: { title: string; reverseHorizontalMix: string } & Record<UnionKey.ThemeLayoutMode, string>;
        recommendColor: string;
        recommendColorDesc: string;
        themeColor: {
          title: string;
          followPrimary: string;
        } & Theme.ThemeColor;
        scrollMode: { title: string } & Record<UnionKey.ThemeScrollMode, string>;
        page: {
          animate: string;
          mode: { title: string } & Record<UnionKey.ThemePageAnimateMode, string>;
        };
        fixedHeaderAndTab: string;
        header: {
          height: string;
          breadcrumb: {
            visible: string;
            showIcon: string;
          };
          multilingual: {
            visible: string;
          };
          globalSearch: {
            visible: string;
          };
        };
        tab: {
          visible: string;
          cache: string;
          height: string;
          mode: { title: string } & Record<UnionKey.ThemeTabMode, string>;
        };
        sider: {
          inverted: string;
          width: string;
          collapsedWidth: string;
          mixWidth: string;
          mixCollapsedWidth: string;
          mixChildMenuWidth: string;
        };
        footer: {
          visible: string;
          fixed: string;
          height: string;
          right: string;
        };
        watermark: {
          visible: string;
          text: string;
          enableUserName: string;
        };
        themeDrawerTitle: string;
        pageFunTitle: string;
        resetCacheStrategy: { title: string } & Record<UnionKey.ResetCacheStrategy, string>;
        configOperation: {
          copyConfig: string;
          copySuccessMsg: string;
          resetConfig: string;
          resetSuccessMsg: string;
        };
      };
      route: Record<I18nRouteKey, string>;
      page: {
        login: {
          common: {
            loginOrRegister: string;
            userNamePlaceholder: string;
            phonePlaceholder: string;
            codePlaceholder: string;
            passwordPlaceholder: string;
            confirmPasswordPlaceholder: string;
            codeLogin: string;
            confirm: string;
            back: string;
            validateSuccess: string;
            loginSuccess: string;
            welcomeBack: string;
          };
          pwdLogin: {
            title: string;
            rememberMe: string;
            forgetPassword: string;
            register: string;
            otherAccountLogin: string;
            otherLoginMode: string;
            superAdmin: string;
            admin: string;
            user: string;
          };
          codeLogin: {
            title: string;
            getCode: string;
            reGetCode: string;
            sendCodeSuccess: string;
            imageCodePlaceholder: string;
          };
          register: {
            title: string;
            agreement: string;
            protocol: string;
            policy: string;
          };
          resetPwd: {
            title: string;
          };
          bindWeChat: {
            title: string;
          };
        };
        home: {
          section1Area: {
            pendingRepair: string;
            removedToday: string;
            pendingProcessing: string;
            inTransit: string;
            devicesUnderRepair: string;
            repairedToday: string;
            pendingListing: string;
            scrappedCount: string;
          };
          branchDesc: string;
          greeting: string;
          weatherDesc: string;
          projectCount: string;
          todo: string;
          message: string;
          downloadCount: string;
          registerCount: string;
          schedule: string;
          study: string;
          work: string;
          rest: string;
          entertainment: string;
          visitCount: string;
          turnover: string;
          dealCount: string;
          projectNews: {
            title: string;
            moreNews: string;
            desc1: string;
            desc2: string;
            desc3: string;
            desc4: string;
            desc5: string;
          };
          creativity: string;
        };
        faults: {
        title: string;
        loadFailed: string;
        totalItems: string;
        copySuccess: string;
        copyFailed: string;
        snCode: string;
        unknown: string;
        type: string;
        machine: string;
        hashBoard: string;
        site: string;
        model: string;
        orderNo: string;
        orderNoCopied: string;
        repairMethod: string;
        none: string;
        flowStatus: string;
        onShelf: string;
        inStock: string;
        waitStock: string;
        logisticsOut: string;
        logisticsIn: string;
        repairing: string;
        repairCompleted: string;
        waitShelf: string;
        scrapped: string;
        unrepaired: string;
        pending: string;
        newOffShelf: string;
        removedSite: string;
        repairStatus: string;
        repaired: string;
        waitRepair: string;
        repairCount: string;
        warranty: string;
        inWarranty: string;
        outOfWarranty: string;
        problemDescription: string;
        offShelfDate: string;
        importTime: string;
        onShelfOrInStockTime: string;
        operation: string;
        deleteSuccess: string;
        deleteFailed: string;
        confirmDelete: string;
        batchCreate: string;
        importCreate: string;
        pleaseSelectDeviceToCreateOrder: string;
        onlySelectOneSite: string;
        onlySelectNewOffShelf: string;
      searchCard: {
        siteFilter: string;
        selectSite: string;
        searchSite: string;
        cancel: string;
        apply: string;
        inputOrderNo: string;
        flowStatus: string;
        repairStatus: string;
        type: string;
        inputSn: string;
        afterSalesSpecialist: string;
        startDate: string;
        endDate: string;
        search: string;
        expand: string;
        collapse: string;
      };
      batchStatus: {
        modifyStatus: string;
        batchModifyStatus: string;
        status: string;
        pleaseSelectStatus: string;
        submit: string;
        cancel: string;
        batchModifyResult: string;
        success: string;
        failure: string;
        errorList: string;
        close: string;
        selectNotNewOffShelf: string;
        selectSameOrder: string;
        modifyFailed: string;
        modifySuccess: string;
      };
      bindWorkOrder: {
        bindWorkOrder: string;
        workOrderNo: string;
        inputWorkOrderNo: string;
        workOrderDate: string;
        inputWorkOrderDate: string;
        site: string;
        selectSite: string;
        faultMachineCount: string;
        selectedFaultMachines: string;
        pleaseSelectMachine: string;
        pleaseSelectSameOrder: string;
        notSelectNewOffShelf: string;
        bindSuccess: string;
        bindFailed: string;
        submit: string;
        cancel: string;
      };
      editFault: {
        edit: string;
        editFaultInfo: string;
        status: string;
        save: string;
        cancel: string;
        editSuccess: string;
        editFailed: string;
        editFault: string;
        sn: string;
        model: string;
        belongSite: string;
        description: string;
        location: string;
        offShelfTime: string;
        selectOffShelfDate: string;
        onShelfTime: string;
        selectOnShelfDate: string;
        editDesc: string;
        editFaultDesc: string;
        desc: string;
      };
      unbindWorkOrder: {
        unbindWorkOrder: string;
        unbindWorkOrderModalTitle: string;
        tip: string;
        unbindTipContent: string;
        waitUnbindCount: string;
        totalSelectCount: string;
        waitUnbindList: string;
        workOrder: string;
        site: string;
        waitUnbind: string;
        cancel: string;
        confirmUnbind: string;
        unbind: string;
        confirmUnbindTip: string;
        close: string;
        pleaseSelectMachine: string;
        noNeedUnbind: string;
        notFoundUnbindMachine: string;
        unbindSuccess: string;
        unbindFailed: string;
      };
      uploadBindWorkOrder: {
          importBindWorkOrder: string;
          importExcel: string;
          siteMachineTemplate: string;
          importErrorPrefix: string;
          import: string;
          repairDetailTemplateName: string;
          importRepairDetailExcel: string;
          repairDetailImportErrorPrefix: string;
          workOrderNo: string;
        inputWorkOrderNo: string;
        selectFile: string;
        downloadTemplate: string;
        cancel: string;
        confirmImport: string;
        importResult: string;
        successImport: string;
        failImport: string;
        errorDetail: string;
        copyError: string;
        exportError: string;
        allSuccess: string;
        close: string;
        templateDownloaded: string;
        noErrorToCopy: string;
        copySuccess: string;
        copyFailed: string;
        noErrorToExport: string;
        index: string;
        errorMessage: string;
        exportSuccess: string;
        pleaseSelectFile: string;
        importFailedFile: string;
        fileUploadFailed: string;
      };
      uploadFileBatchStatus: {
          importUpdateStatus: string;
          batchModifyStatus: string;
          workOrderNo: string;
          inputWorkOrderNo: string;
          status: string;
          selectStatus: string;
          fileUpload: string;
          chooseFile: string;
          noFileChosen: string;
          supportFormat: string;
          selectedFile: string;
          downloadTemplate: string;
          submit: string;
          cancel: string;
          batchModifyResult: string;
          successCount: string;
          failureCount: string;
          errorList: string;
          close: string;
          pleaseUploadFile: string;
          templateName: string;
          templateDownloaded: string;
        };
      uploadWorkOrder: {
        importCreateOrder: string;
        orderNo: string;
        inputOrderNo: string;
        orderCreateTime: string;
        selectOrderCreateTime: string;
        site: string;
        selectSite: string;
        selectFile: string;
        downloadTemplate: string;
        cancel: string;
        confirmImport: string;
        importResult: string;
        successImport: string;
        failImport: string;
        errorDetail: string;
        copyError: string;
        exportError: string;
        allSuccess: string;
        close: string;
        pleaseSelectSite: string;
        pleaseSelectFile: string;
        fileUploadFailed: string;
      };
        createOrderSuccess: string;
        createOrderFailed: string;
        mySite: string;
        exportSuccess: string;
        exportFailed: string;
        siteName: string;
        machineModel: string;
        location: string;
        faultReason: string;
        offShelfTime: string;
        onShelfTime: string;
        warrantyStatus: string;
        creator: string;
        remark: string;
        updateTime: string;
        repairResult: string;
        import: string;
        createOrder: string;
        bindOrder: string;
        exportExcel: string;
        orderDate: string;
        faultMachineCount: string;
        selectedMachineList: string;
        create: string;
        cancel: string;
        confirm: string;
        cancelSelection: string;
        siteList: string;
        batchBind: string;
        importBind: string;
        machineImport: string;
        hashBoardImport: string;
        machineImportTemplate: string;
        hashBoardImportTemplate: string;
        snCodeCopied: string;
      };
      repairReport: {
          // title: string;
          statisticalPeriod: string;
          custom: string;
          quick: string;
          last30Days: string;
          last60Days: string;
          last90Days: string;
          all: string;
          search: string;
          reset: string;
          searchSuccess: string;
          resetSuccess: string;
          siteDimensionAnalysis: string;
          stationDimensionAnalysis: string;
          totalRepairs: string;
          repaired: string;
          pendingRepair: string;
          scrappedCount: string;
          repairRate: string;
          scrapRate: string;
          trendAnalysis: string;
          repairCount: string;
          scrapCount: string;// 报废数
          machineFaultRate: string;
          componentFaultRate: string;
          coolingModeFaultRate: string;
          regionFaultMachineRate: string;
          secondRepairRateTop5: string;
          scrapRateTop5: string;
          detailedDataStatistics: string;
          filter: string;
          searchName: string;
          searchSite: string;
          selectDimension: string;
          export: string;
          totalItems: string;
          siteName: string;
          stationName: string;
          secondRepairCount: string;
          secondRepairRate: string;
          secondRepairRatePercent: string;
          scrapRatePercent: string;
          repairCountLabel: string;
          secondRepairCountTrend: string;
          scrapCountTrend: string;
          totalReturnRate: string;
          totalScrapRate: string;
          unitMachine: string;
          searchStation: string;
          siteDimension: string;
          stationDimension: string;
        };
        repairRecords: {
        title: string;
        pleaseEnterWorkOrderNo: string;
        pleaseEnterMachineSn: string;
        pleaseSelectSite: string;
        repairType: string;
        repairResult: string;
          importMachine: string;
          importBoard: string;
          importMachineTitle: string;
          importBoardTitle: string;
          totalItems: string;
          snCopied: string;
          copyFailed: string;
          unknown: string;
          machine: string;
          hashBoard: string;
          orderNoCopied: string;
          snCode: string;
          type: string;
          site: string;
          orderNo: string;
          repairStation: string;
          repairStationGroup: string;
          machineModel: string;
          repairComponent: string;
          defectReason: string;
          verifyDefect: string;
          repairStatus: string;
          date: string;
          action: string;
          detail: string;
          componentMark: string;
          loadFailed: string;
          exportCsvTitle: string;
          import: string;
          exportSuccess: string;
          exportFailed: string;
          importFailed: string;
          exportHeaders: {
            date: string;
            orderNo: string;
            machineModel: string;
            machineSn: string;
            powerSn: string;
            board1Sn: string;
            board2Sn: string;
            board3Sn: string;
            controlSn: string;
            repairComponent: string;
            extraOperations: string;
            defectReason: string;
            defectCode2: string;
            defectCode3: string;
            position: string;
            verifyDefect: string;
            startTime: string;
            endTime: string;
            repairResult: string;
            downTime: string;
            onShelfTime: string;
            createdAt: string;
            updatedAt: string;
            repairer: string;
        repairStation: string;
      };
    };
    scrapMachine: {
      title: string;
      totalScrapCount: string;
      exportData: string;
      scrapNo: string;
      site: string;
      model: string;
      machineSn: string;
      controlSn: string;
      board1Sn: string;
      board2Sn: string;
      board3Sn: string;
      powerSn: string;
      status: string;
      scrapDate: string;
      scrapCount: string;
      action: string;
      times: string;
      approved: string;
      repaired: string;
      confirmScrap: string;
      previous: string;
      next: string;
      showingRecords: string;
      fetchSiteDataFailed: string;
      alreadyApproved: string;
      confirmAction: string;
      confirmScrapPrompt: string;
      confirm: string;
      cancel: string;
      operationSuccess: string;
      operationFailed: string;
      pendingProcess: string;
      pendingReview: string;
      unknown: string;
      exportFailed: string;
      noDataToExport: string;
      exportSuccess: string;
      searchSn: string;
      clear: string;
      allSites: string;
      allStatuses: string;
      allRepairCounts: string;
      scrapDetailExport: string;
      scrapDetailExportFile: string;
      detailTitle: string;
      noData: string;
    };
    scrapFlagsModal: {
      batchImport: string;
      importData: string;
      repairStationGroup: string;
      componentMark: string;
      repairImage: string;
      uploadImage: string;
      uploadImageButton: string;
      cancel: string;
      add: string;
      save: string;
      normal: string;
      damaged: string;
      selectAll: string;
      componentName: string;
      serialNumber: string;
      functionalStatus: string;
      pleaseEnterSN: string;
      saveSuccess: string;
      saveFailed: string;
      missingDetailId: string;
      loadFlagFailed: string;
      loadFlagFailedMsg: string;
      imageAdded: string;
      unknownComponent: string;
      pleaseEnterValidSN: string;
      snSaved: string;
      controlBoardSN: string;
      powerSN: string;
      board1SN: string;
      board2SN: string;
      board3SN: string;
    };
    repairStation: {
      companyName: string;
      repairStationGroup: string;
      legalRepresentative: string;
      kycStatus: string;
      address: string;
      contactName: string;
      contactPhone: string;
      actions: string;
      authenticated: string;
      unauthenticated: string;
      edit: string;
      delete: string;
      confirmDeleteTitle: string;
      confirmDeleteContent: string;
      confirm: string;
      cancel: string;
      deleteSuccess: string;
      deleteFailed: string;
      loadFailed: string;
      addStation: string;
      searchPlaceholder: string;
      paginationPrefix: string;
      pleaseFillComplete: string;
      addSuccess: string;
      addFailed: string;
      stationName: string;
      pleaseEnterStationName: string;
      pleaseEnterDetailedAddress: string;
      pleaseEnterLegalRepresentative: string;
      pleaseEnterContactName: string;
      pleaseEnterContactPhone: string;
      score: string;
      pleaseEnterScore: string;
      submit: string;
      editDataNotExist: string;
      editSuccess: string;
      editFailed: string;
      editStation: string;
      save: string;
    };
    users: {
      addSuccess: string;
      addFailed: string;
      editSuccess: string;
      editFailed: string;
      loadFailed: string;
      bindSuccess: string;
      bindFailed: string;
      fetchExternalFailed: string;
      fetchCompanyFailed: string;
      validation: {
        requireCompany: string;
        requireGroup: string;
        requireUsername: string;
        requireRealName: string;
        requirePassword: string;
        requirePhone: string;
        requireEmail: string;
        invalidEmail: string;
        requireExternalUser: string;
        requireRole: string;
      };
      columns: {
        username: string;
        realName: string;
        roleType: string;
        phone: string;
        email: string;
        company: string;
        startDate: string;
        status: string;
        actions: string;
      };
      actions: {
        edit: string;
        bindUser: string;
        addUser: string;
      };
      search: {
        rolePlaceholder: string;
        namePlaceholder: string;
      };
      modal: {
        addTitle: string;
        editTitle: string;
        bindTitle: string;
        usernameLabel: string;
        usernamePlaceholder: string;
        realNameLabel: string;
        realNamePlaceholder: string;
        passwordLabel: string;
        passwordEditLabel: string;
        passwordPlaceholder: string;
        roleLabel: string;
        rolePlaceholder: string;
        groupLabel: string;
        groupPlaceholder: string;
        phoneLabel: string;
        phonePlaceholder: string;
        emailLabel: string;
        emailPlaceholder: string;
        companyLabel: string;
        companyPlaceholder: string;
        statusLabel: string;
        statusPlaceholder: string;
        externalUserLabel: string;
        externalUserPlaceholder: string;
        save: string;
        cancel: string;
        confirmBind: string;
      };
      unknown: string;
      paginationPrefix: string;
    };
    miningSite: {
          title: string;
          editSiteInfo: string;
          siteName: string;
          siteAddress: string;
          assetCount: string;
          siteStatus: string;
          resident: string;
          mailRepair: string;
          afterSalesSpecialist: string;
      autoBindMachineOrder: string;
      orderNumber: string;
      selectOrderAutoBindRequired: string;
      autoBindBoardOrder: string;
      boardOrderNumber: string;
      selectBoardOrderAutoBindRequired: string;
      save: string;
      cancel: string;
      modifyOnShelfWaitRepairCount: string;
      onShelfWaitRepairCount: string;
      mySite: string;
      totalItems: string;
      autoBindOrderRequired: string;
      autoBindBoardOrderRequired: string;
      modifySuccess: string;
      modifyFailed: string;
      getOrdersFailed: string;
      getUsersFailed: string;
      loadFailed: string;
      auto: string;
      manual: string;
      totalHostedMachines: string;
      fault24hCount: string;
      fault24hCountTooltip: string;
      abnormalCount: string;
      abnormalCountTooltip: string;
      todayShelfCount: string;
      todayShelfCountTooltip: string;
          inLogistics: string;
          inLogisticsTooltip: string;
          pendingShelf: string;
          pendingShelfTooltip: string;
          repairingCount: string;
          repairingCountTooltip: string;
          onShelfWaitRepairCountTooltip: string;
          waitRepairCount: string;
          waitRepairCountTooltip: string;
          waitRepairRate: string;
          waitRepairRateTooltip: string;
          netFaultCount: string;
          netFaultCountTooltip: string;
          scrappedCount: string;
          scrappedCountTooltip: string;
          machineOrderBind: string;
          boardOrderBind: string;
          repairStatus: string;
          operation: string;
          editDailyReport: string;
          dailyReport: string;
          edit: string;
          view: string;
          statusLabel: string;
          searchBar: {
            placeholder: {
              siteName: string;
              afterSalesSpecialist: string;
              siteStatus: string;
              bindType: string;
            };
            allSites: string;
          };
          status: {
            active: string;
            inactive: string;
            remove: string;
          };
        };
        siteDetail: {
          invalidSiteId: string;
          loadFailed: string;
          back: string;
          basicInfo: string;
          siteName: string;
          siteAddress: string;
          siteStatus: string;
          statusOnsite: string;
          statusSendRepair: string;
          statusBoth: string;
          afterSalesManager: string;
          assetStats: string;
          totalAssets: string;
          faultCount: string;
          inLogistics: string;
          repairing: string;
          onShelfWaitRepair: string;
          totalWaitRepair: string;
          waitOnShelf: string;
          scrappedCount: string;
          unit: string;
          historyData: string;
          date: string;
          loadHistoryFailed: string;
        };
        repairRecordsDetail: {
          title: string;
          edit: string;
          save: string;
          cancel: string;
          baseInfo: string;
          date: string;
          workOrderNo: string;
          repairType: string;
          repairStation: string;
          deviceInfo: string;
          wholeMachineSN: string;
          controlBoardSN: string;
          powerSN: string;
          board1SN: string;
          board2SN: string;
          board3SN: string;
          repairDetail: string;
          repairComponent: string;
          extraOperations: string;
          defectReason: string;
          defectCodeL2: string;
          defectCodeL3: string;
          positionInfo: string;
          verifyDefect: string;
          repairImage: string;
          imagePreview: string;
          repairProcess: string;
          startTime: string;
          endTime: string;
          repairStatus: string;
          repairer: string;
          pleaseEnterPowerSN: string;
          pleaseEnterBoard1SN: string;
          pleaseEnterBoard2SN: string;
          pleaseEnterBoard3SN: string;
          pleaseEnterOther: string;
          pleaseEnterDefectCodeL2: string;
          pleaseEnterDefectCodeL3: string;
          uploadImage: string;
          saveSuccess: string;
          getDetailFailed: string;
          repairTypeWhole: string;
          repairTypeBoard: string;
          componentBoard1: string;
          componentBoard2: string;
          componentBoard3: string;
          componentPower: string;
          componentControlBoard: string;
          componentOther: string;
          operationSilicone: string;
          operationConformalCoating: string;
          operationBoostModule: string;
          operationCleanDust: string;
          operationAluminum: string;
        };
        operationLogs: {
          title: string;
          status: {
            success: string;
            fail: string;
          };
          modules: {
            site: string;
            faultMachine: string;
            workOrder: string;
            scrapMachine: string;
            repairDetail: string;
          };
          operationTypes: {
            create: string;
            update: string;
            delete: string;
            dispatch: string;
            import: string;
            bindOrder: string;
            unbindOrder: string;
          };
          columns: {
            id: string;
            username: string;
            module: string;
            operationType: string;
            targetTable: string;
            targetId: string;
            requestMethod: string;
            requestUrl: string;
            requestParams: string;
            beforeData: string;
            afterData: string;
            ipAddress: string;
            userAgent: string;
            status: string;
            errorMessage: string;
            createTime: string;
          };
          pagination: {
            total: string;
          };
          messages: {
            fetchFail: string;
            fetchError: string;
          };
          searchBar: {
            selectUser: string;
            selectStatus: string;
            selectModule: string;
            selectOperationType: string;
            reset: string;
          };
        };
        workflowDetail: {
      title: string;
      basicInfo: string;
      orderNo: string;
      orderStatus: string;
      site: string;
      repairStation: string;
      repairMethod: string;
      faultCount: string;
      faultDeviceList: string;
      inputSN: string;
      flowStatus: string;
      repairStatus: string;
      exportCSV: string;
      operationLog: string;
      deviceInfo: string;
      machineSN: string;
      controlBoardSN: string;
      powerSN: string;
      inputPowerSN: string;
      repairDetail: string;
      repairComponent: string;
      repairProcess: string;
      startTime: string;
      endTime: string;
      time: string;
      operation: string;
      operator: string;
      description: string;
      totalItems: string;
      operationLogExport: string;
      exportSuccess: string;
      exportFailed: string;
      sequence: string;
      deviceSN: string;
      model: string;
      canOperate: string;
      repairDetailBtn: string;
      faultDeviceExport: string;
      unknown: string;
      loadFailed: string;
      getDetailFailed: string;
      date: string;
      macAddress: string;
      board1SN: string;
      inputBoard1SN: string;
      board2SN: string;
      inputBoard2SN: string;
      board3SN: string;
      inputBoard3SN: string;
      other: string;
      inputOtherItem: string;
      extraOperations: string;
      defectReason: string;
      defectCode2: string;
      inputDefectCode2: string;
      defectCode3: string;
      inputDefectCode3: string;
      positionInfo: string;
      verifyDefect: string;
      repairPartImage: string;
      uploadImage: string;
      imagePreview: string;
      preview: string;
      repairer: string;
      save: string;
      addSuccess: string;
      componentOptions: {
        board1: string;
        board2: string;
        board3: string;
        power: string;
        controlBoard: string;
        other: string;
      };
      extraOperationOptions: {
        thermalGrease: string;
        conformalCoating: string;
        boostModule: string;
        dustCleaning: string;
        aluminumFoil: string;
      };
    };
        workflow: {
        title: string;
        groupName: string;
        totalItems: string;
          pleaseSelectOrderToDispatch: string;
          pleaseSelectUnDispatchedOrder: string;
          batchDispatchRemark: string;
          pleaseSelectRepairMethod: string;
          pleaseSelectStation: string;
          dispatchSuccess: string;
          dispatchFail: string;
          dispatchPartialSuccess: string;
          dispatchFailed: string;
          confirmReturnOrderTitle: string;
          confirmReturnOrderContent: string;
          confirm: string;
          cancel: string;
          userReturnOrder: string;
          returnSuccess: string;
          returnFailed: string;
          modifySuccess: string;
          modifyFailed: string;
          orderNo: string;
          copySuccess: string;
          copyFailed: string;
          faultCount: string;
          repairMethod: string;
          orderStatus: string;
          createdAt: string;
          paymentStatus: string;
          paymentDate: string;
          createDate: string;
          site: string;
          repairer: string;
          afterSalesSpecialist: string;
          operation: string;
          loadFailed: string;
          getSiteDataFailed: string;
          getStationDataFailed: string;
          getOrderLogFailed: string;
          getOrderLogException: string;
          batchDispatch: string;
          mySite: string;
          modifyOrderInfo: string;
          pleaseSelectRepairMethodPlaceholder: string;
          selectStation: string;
          pleaseSelectNearestStation: string;
          unpaid: string;
          paid: string;
          save: string;
          orderOperationLog: string;
          operator: string;
          close: string;
          dispatch: string;
          selectFaultCount: string;
          remark: string;
          pleaseEnterRemark: string;
          confirmDispatch: string;
          completed: string;
        repairing: string;
        unresolved: string;
        pending: string;
        processing: string;
        unapplied: string;
        unknown: string;
        yes: string;
        no: string;
        none: string;
        view: string;
        edit: string;
        log: string;
        historyLog: string;
        revoke: string;
        searchSite: string;
        apply: string;
        startDate: string;
        endDate: string;
        search: string;
        reset: string;
        expand: string;
        collapse: string;
        siteFilter: string;
        addOrderLogTitle: string;
        pleaseSelectOrderStatus: string;
        operationTime: string;
        pleaseSelectOperationTime: string;
        operationDescription: string;
        pleaseEnterOperationDescription: string;
        confirmAdd: string;
        addLogSuccess: string;
        addLogFailed: string;
      };
        siteDailyReport: {
          title: string;
          siteDailyReport: string;
          enterSiteName: string;
          selectAfterSales: string;
          selectSiteStatus: string;
          selectWorkOrderType: string;
          mySite: string;
          siteName: string;
          assetCount: string;
          fault24hCount: string;
          inLogistics: string;
          pendingShelf: string;
          repairingCount: string;
          pendingOnShelfRepair: string;
          pendingRepair: string;
          operation: string;
          dailyReport: string;
          edit: string;
          view: string;
        };

      };
      form: {
        required: string;
        userName: FormMsg;
        phone: FormMsg;
        pwd: FormMsg;
        confirmPwd: FormMsg;
        code: FormMsg;
        email: FormMsg;
      };
      dropdown: Record<Global.DropdownKey, string>;
      icon: {
        themeConfig: string;
        themeSchema: string;
        lang: string;
        fullscreen: string;
        fullscreenExit: string;
        reload: string;
        collapse: string;
        expand: string;
        pin: string;
        unpin: string;
      };
      datatable: {
        itemCount: string;
      };
    };

    type GetI18nKey<T extends Record<string, unknown>, K extends keyof T = keyof T> = K extends string
      ? T[K] extends Record<string, unknown>
        ? `${K}.${GetI18nKey<T[K]>}`
        : K
      : never;

    type I18nKey = GetI18nKey<Schema>;

    type TranslateOptions<Locales extends string> = import('vue-i18n').TranslateOptions<Locales>;

    interface $T {
      (key: I18nKey): string;
      (key: I18nKey, plural: number, options?: TranslateOptions<LangType>): string;
      (key: I18nKey, defaultMsg: string, options?: TranslateOptions<I18nKey>): string;
      (key: I18nKey, list: unknown[], options?: TranslateOptions<I18nKey>): string;
      (key: I18nKey, list: unknown[], plural: number): string;
      (key: I18nKey, list: unknown[], defaultMsg: string): string;
      (key: I18nKey, named: Record<string, unknown>, options?: TranslateOptions<LangType>): string;
      (key: I18nKey, named: Record<string, unknown>, plural: number): string;
      (key: I18nKey, named: Record<string, unknown>, defaultMsg: string): string;
    }
  }

  /** Service namespace */
  namespace Service {
    /** Other baseURL key */
    type OtherBaseURLKey = 'demo';

    interface ServiceConfigItem {
      /** The backend service base url */
      baseURL: string;
      /** The proxy pattern of the backend service base url */
      proxyPattern: string;
    }

    interface OtherServiceConfigItem extends ServiceConfigItem {
      key: OtherBaseURLKey;
    }

    /** The backend service config */
    interface ServiceConfig extends ServiceConfigItem {
      /** Other backend service config */
      other: OtherServiceConfigItem[];
    }

    interface SimpleServiceConfig extends Pick<ServiceConfigItem, 'baseURL'> {
      other: Record<OtherBaseURLKey, string>;
    }

    /** The backend service response data */
    type Response<T = unknown> = {
      /** The backend service response code */
      code: string;
      /** The backend service response message */
      msg: string;
      /** The backend service response data */
      data: T;
    };

    /** The demo backend service response data */
    type DemoResponse<T = unknown> = {
      /** The backend service response code */
      status: string;
      /** The backend service response message */
      message: string;
      /** The backend service response data */
      result: T;
    };
  }
}
