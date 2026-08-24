"use client";

import { useEffect, useState } from "react";

import {
  Asset,
  Liability,
  PortfolioItem,
  AssetCategory,
  LiabilityCategory,
  AssetClass,
  GoalType,
} from "@/lib/investments";

type PortfolioFormProps = {
  item?: PortfolioItem | null;
  onSave: (item: Asset | Liability) => void;
  onCancel: () => void;
};

export default function PortfolioForm({
  item,
  onSave,
  onCancel,
}: PortfolioFormProps) {

  const isEditing = item !== null && item !== undefined;

  // --------------------------------------------------
  // Common Fields
  // --------------------------------------------------

  const [type, setType] = useState<"Asset" | "Liability">(
    item?.type ?? "Asset"
  );

  const [name, setName] = useState(
    item?.name ?? ""
  );

  const [currentValue, setCurrentValue] = useState(
    item ? String(item.currentValue) : ""
  );

  // --------------------------------------------------
  // Asset Fields
  // --------------------------------------------------

  const [assetCategory, setAssetCategory] =
    useState<AssetCategory>(
      item?.type === "Asset"
        ? item.category
        : "Mutual Fund"
    );

  const [assetClass, setAssetClass] =
    useState<AssetClass>(
      item?.type === "Asset"
        ? item.assetClass
        : "Equity"
    );

  const [goal, setGoal] =
    useState<GoalType>(
      item?.type === "Asset"
        ? item.goal
        : "Retirement"
    );

  const [investedAmount, setInvestedAmount] =
    useState(
      item?.type === "Asset"
        ? String(item.investedAmount)
        : ""
    );

  const [monthlyContribution, setMonthlyContribution] =
    useState(
      item?.type === "Asset"
        ? String(item.monthlyContribution)
        : ""
    );

  const [expectedReturn, setExpectedReturn] =
    useState(
      item?.type === "Asset"
        ? String(item.expectedReturn)
        : "12"
    );

  const [riskLevel, setRiskLevel] =
    useState<"Low" | "Medium" | "High">(
      item?.type === "Asset"
        ? item.riskLevel
        : "Medium"
    );

  // --------------------------------------------------
  // Liability Fields
  // --------------------------------------------------

  const [liabilityCategory, setLiabilityCategory] =
    useState<LiabilityCategory>(
      item?.type === "Liability"
        ? item.category
        : "Home Loan"
    );

  const [interestRate, setInterestRate] =
    useState(
      item?.type === "Liability"
        ? String(item.interestRate)
        : ""
    );

  const [emi, setEmi] =
    useState(
      item?.type === "Liability"
        ? String(item.emi)
        : ""
    );

  const [remainingMonths, setRemainingMonths] =
    useState(
      item?.type === "Liability"
        ? String(item.remainingMonths)
        : ""
    );

  // --------------------------------------------------
  // Reload values when editing another item
  // --------------------------------------------------

  useEffect(() => {

    if (!item) return;

    setType(item.type);

    setName(item.name);

    setCurrentValue(
      String(item.currentValue)
    );

    if (item.type === "Asset") {

      setAssetCategory(item.category);

      setAssetClass(item.assetClass);

      setGoal(item.goal);

      setInvestedAmount(
        String(item.investedAmount)
      );

      setMonthlyContribution(
        String(item.monthlyContribution)
      );

      setExpectedReturn(
        String(item.expectedReturn)
      );

      setRiskLevel(item.riskLevel);

    } else {

      setLiabilityCategory(item.category);

      setInterestRate(
        String(item.interestRate)
      );

      setEmi(
        String(item.emi)
      );

      setRemainingMonths(
        String(item.remainingMonths)
      );

    }

  }, [item]);
  const handleSave = () => {

  if (!name.trim()) {
    alert("Please enter a name.");
    return;
  }

  if (!currentValue) {
    alert("Please enter current value.");
    return;
  }

  if (type === "Asset") {

    const asset: Asset = {

      id:
        item?.type === "Asset"
          ? item.id
          : crypto.randomUUID(),

      type: "Asset",

      name,

      category: assetCategory,

      assetClass,

      currentValue: Number(currentValue),

      investedAmount: Number(
        investedAmount || 0
      ),

      monthlyContribution: Number(
        monthlyContribution || 0
      ),

      expectedReturn: Number(
        expectedReturn || 0
      ),

      goal,

      riskLevel,

    };

    onSave(asset);

    return;
  }

  const liability: Liability = {

    id:
      item?.type === "Liability"
        ? item.id
        : crypto.randomUUID(),

    type: "Liability",

    name,

    category: liabilityCategory,

    currentValue: Number(currentValue),

    originalAmount:
      item?.type === "Liability"
        ? item.originalAmount
        : Number(currentValue),

    outstandingAmount: Number(currentValue),

    interestRate: Number(
      interestRate || 0
    ),

    emi: Number(
      emi || 0
    ),

    tenureMonths: Number(
      remainingMonths || 0
    ),

    remainingMonths: Number(
      remainingMonths || 0
    ),

  };

  onSave(liability);

};
return (
  <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-6">

    <h2 className="mb-6 text-2xl font-bold text-white">
      {isEditing
        ? "Edit Portfolio Item"
        : "Add Portfolio Item"}
    </h2>

    {/* Type */}

    <div className="mb-5">

      <label className="mb-2 block text-sm text-zinc-400">
        Type
      </label>

      <select
        disabled={isEditing}
        value={type}
        onChange={(e) =>
          setType(
            e.target.value as
              | "Asset"
              | "Liability"
          )
        }
        className={`w-full rounded-lg border border-zinc-700 p-3 text-white ${
          isEditing
            ? "cursor-not-allowed bg-zinc-700"
            : "bg-zinc-800"
        }`}
      >
        <option>Asset</option>
        <option>Liability</option>
      </select>

    </div>

    {/* Name */}

    <div className="mb-5">

      <label className="mb-2 block text-sm text-zinc-400">
        Name
      </label>

      <input
        value={name}
        onChange={(e) =>
          setName(e.target.value)
        }
        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-white"
      />

    </div>

    {/* Current Value */}

    <div className="mb-5">

      <label className="mb-2 block text-sm text-zinc-400">
        Current Value
      </label>

      <input
        type="number"
        value={currentValue}
        onChange={(e) =>
          setCurrentValue(
            e.target.value
          )
        }
        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-white"
      />

    </div>

    {type === "Asset" ? (

      <>
      <div className="grid grid-cols-2 gap-4">

  <div>

    <label className="mb-2 block text-sm text-zinc-400">
      Category
    </label>

    <select
      value={assetCategory}
      onChange={(e) =>
        setAssetCategory(
          e.target.value as AssetCategory
        )
      }
      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-white"
    >
      <option>Mutual Fund</option>
      <option>PPF</option>
      <option>EPF</option>
      <option>Stocks</option>
      <option>Gold</option>
      <option>Emergency Fund</option>
      <option>Savings Account</option>
    </select>

  </div>

  <div>

    <label className="mb-2 block text-sm text-zinc-400">
      Asset Class
    </label>

    <select
      value={assetClass}
      onChange={(e) =>
        setAssetClass(
          e.target.value as AssetClass
        )
      }
      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-white"
    >
      <option>Equity</option>
      <option>Debt</option>
      <option>Hybrid</option>
      <option>Alternative</option>
      <option>Cash</option>
    </select>

  </div>

</div>

<div className="mt-5 grid grid-cols-2 gap-4">

  <div>

    <label className="mb-2 block text-sm text-zinc-400">
      Invested Amount
    </label>

    <input
      type="number"
      value={investedAmount}
      onChange={(e) =>
        setInvestedAmount(
          e.target.value
        )
      }
      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-white"
    />

  </div>

  <div>

    <label className="mb-2 block text-sm text-zinc-400">
      Monthly Contribution
    </label>

    <input
      type="number"
      value={monthlyContribution}
      onChange={(e) =>
        setMonthlyContribution(
          e.target.value
        )
      }
      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-white"
    />

  </div>

  <div>

    <label className="mb-2 block text-sm text-zinc-400">
      Expected Return (%)
    </label>

    <input
      type="number"
      value={expectedReturn}
      onChange={(e) =>
        setExpectedReturn(
          e.target.value
        )
      }
      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-white"
    />

  </div>

  <div>

    <label className="mb-2 block text-sm text-zinc-400">
      Goal
    </label>

    <select
      value={goal}
      onChange={(e) =>
        setGoal(
          e.target.value as GoalType
        )
      }
      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-white"
    >
      <option>Retirement</option>
      <option>Emergency Fund</option>
      <option>Education</option>
      <option>House</option>
      <option>Vacation</option>
      <option>Wealth Creation</option>
    </select>

  </div>

  <div className="col-span-2">

    <label className="mb-2 block text-sm text-zinc-400">
      Risk Level
    </label>

    <select
      value={riskLevel}
      onChange={(e) =>
        setRiskLevel(
          e.target.value as
            | "Low"
            | "Medium"
            | "High"
        )
      }
      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-white"
    >
      <option>Low</option>
      <option>Medium</option>
      <option>High</option>
    </select>

  </div>

</div>

</>

) : (

<>

  <div className="mb-5">

    <label className="mb-2 block text-sm text-zinc-400">
      Category
    </label>

    <select
      value={liabilityCategory}
      onChange={(e) =>
        setLiabilityCategory(
          e.target.value as LiabilityCategory
        )
      }
      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-white"
    >
      <option>Home Loan</option>
      <option>Vehicle Loan</option>
      <option>Personal Loan</option>
      <option>Education Loan</option>
      <option>Credit Card</option>
      <option>Other</option>
    </select>

  </div>

  <div className="grid grid-cols-3 gap-4">

    <input
      type="number"
      placeholder="Interest %"
      value={interestRate}
      onChange={(e) =>
        setInterestRate(
          e.target.value
        )
      }
      className="rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-white"
    />

    <input
      type="number"
      placeholder="EMI"
      value={emi}
      onChange={(e) =>
        setEmi(
          e.target.value
        )
      }
      className="rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-white"
    />

    <input
      type="number"
      placeholder="Remaining Months"
      value={remainingMonths}
      onChange={(e) =>
        setRemainingMonths(
          e.target.value
        )
      }
      className="rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-white"
    />

  </div>

</>
)}
      <div className="mt-8 flex gap-3">

        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-zinc-700 py-3 text-white hover:bg-zinc-800"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleSave}
          className="flex-1 rounded-xl bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700"
        >
          {isEditing
            ? "Update Item"
            : "Save"}
        </button>

      </div>

    </div>
  );
}