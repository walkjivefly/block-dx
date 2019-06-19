import { Component, ViewChild, NgZone, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { AppService } from './app.service';
import { PricingService } from './pricing.service';
import { OrderbookService } from './orderbook.service';
import { OrderbookComponent } from './orderbook.component';
import { BigTooltipComponent } from './big-tooltip/big-tooltip.component';

@Component({
  selector: 'app-mainview',
  templateUrl: './mainview.component.html',
  styleUrls: ['./mainview.component.scss']
})
export class MainviewComponent implements OnInit {
  @ViewChild('orderbook')
  public orderbook: OrderbookComponent;

  public orderCardIndex = 0; // Temporary FIXME
  public decimalOptions: any[];
  public initialDecimalIdx: number;
  public pricingEnabled = false;
  public viewAllOrders = true;
  public viewSellOrders = false;
  public viewBuyOrders = false;

  public showBalancesTooltip = false;
  public showOrderFormTooltip = false;
  public showOrderBookTooltip = false;

  constructor(
    private route: ActivatedRoute,
    private appService: AppService,
    private orderbookService: OrderbookService,
    private pricingService: PricingService,
    private zone: NgZone
  ) {
    this.decimalOptions = [
      {value: '8', viewValue:'8 decimals'},
      {value: '6', viewValue:'6 decimals'},
      {value: '4', viewValue:'4 decimals'},
      {value: '2', viewValue:'2 decimals'}
    ];
    const initialPriceDecimal = localStorage.getItem('priceDecimal') || '6';
    this.initialDecimalIdx = this.decimalOptions.findIndex(({ value }) => value === initialPriceDecimal);
  }

  ngOnInit() {
    this.pricingService.getPricingEnabled().subscribe(enabled => {
      this.zone.run(() => {
        this.pricingEnabled = enabled;
      });
    });
  }

  onNavChange(list) {
    if (list.contains('book')) {
      this.orderbook.orderbookTopTable.scrollToBottom();
    }
  }

  setPriceDecimal(num) {
    this.orderbookService.setPriceDecimal(num);
  }

  balancesTooltip(show) {
    this.showBalancesTooltip = show;
  }
  orderFormTooltip(show) {
    this.showOrderFormTooltip = show;
  }
  orderBookTooltip(show) {
    this.showOrderBookTooltip = show;
  }

  updateView(view) {
    //let sellOrderSection = document.querySelector(".orderbook-table-outer-container-top .ps") as HTMLElement;
    //let buyOrderSection = document.querySelector(".orderbook-table-outer-container-bottom .ps") as HTMLElement;
    this.viewAllOrders = false;
    this.viewSellOrders = false;
    this.viewBuyOrders = false;
    switch(view) {
      case "sells":
        this.viewSellOrders = true
        //this.orderbookTopTable.scrollToBottom();
        break;
      case "buys":
        this.viewBuyOrders = true
        //this.orderbookBottomTable.scrollToTop();
        break;
      default:
        //view both buys and sells
        this.viewAllOrders = true;
        //this.orderbookTopTable.scrollToBottom();
        //this.orderbookBottomTable.scrollToTop();
        break;
    }
  }

}
